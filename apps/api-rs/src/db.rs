use crate::models::*;
use crate::password::{hash_password, verify_password};
use chrono::Utc;
use rusqlite::{params, Connection, OptionalExtension};
use std::sync::Mutex;
use uuid::Uuid;

pub const SCHEMA: &str = r#"
CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  doc TEXT NOT NULL,
  active INTEGER NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_products_active ON products (active);

CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  doc TEXT NOT NULL,
  status TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_orders_status_created ON orders (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_email_created ON orders (contact_email, created_at DESC);

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  doc TEXT NOT NULL,
  login TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  doc TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs (created_at DESC);

CREATE TABLE IF NOT EXISTS revoked_tokens (
  jti TEXT PRIMARY KEY,
  expires_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_revoked_expires ON revoked_tokens (expires_at);
"#;

pub struct Store {
    pub conn: Mutex<Connection>,
}

impl Store {
    pub fn open(path: &str) -> anyhow::Result<Self> {
        let conn = if path == ":memory:" {
            Connection::open_in_memory()?
        } else {
            Connection::open(path)?
        };
        conn.execute_batch("PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000;")?;
        conn.execute_batch(SCHEMA)?;
        Ok(Self {
            conn: Mutex::new(conn),
        })
    }

    pub fn seed_if_empty(&self, products: &[Product]) -> anyhow::Result<()> {
        let conn = self.conn.lock().unwrap();
        let count: i64 = conn.query_row("SELECT COUNT(*) FROM products", [], |r| r.get(0))?;
        if count > 0 {
            return Ok(());
        }
        let tx = conn.unchecked_transaction()?;
        for p in products {
            insert_product(&tx, p)?;
        }
        tx.commit()?;
        Ok(())
    }

    pub fn ensure_admin(&self, login: &str, password: &str) -> anyhow::Result<User> {
        let conn = self.conn.lock().unwrap();
        if let Some(user) = find_admin(&conn)? {
            return Ok(user);
        }
        if password.len() < 12 {
            anyhow::bail!("Password must contain at least 12 characters.");
        }
        let now = Utc::now();
        let user = User {
            id: Uuid::new_v4().to_string(),
            login: login.to_string(),
            password_hash: hash_password(password),
            role: "admin".into(),
            token_version: 0,
            created_at: now,
            updated_at: now,
        };
        let doc = serde_json::to_string(&user)?;
        conn.execute(
            "INSERT INTO users (id, doc, login) VALUES (?1, ?2, ?3)",
            params![user.id, doc, user.login],
        )?;
        Ok(user)
    }

    pub fn purge_expired_tokens(&self) -> anyhow::Result<()> {
        let conn = self.conn.lock().unwrap();
        let now = Utc::now().to_rfc3339();
        conn.execute("DELETE FROM revoked_tokens WHERE expires_at < ?1", params![now])?;
        Ok(())
    }

    pub fn list_active_products(&self) -> anyhow::Result<Vec<Product>> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare(
            "SELECT doc FROM products WHERE active = 1 ORDER BY json_extract(doc, '$.name.en') ASC",
        )?;
        let rows = stmt.query_map([], |r| {
            let doc: String = r.get(0)?;
            Ok(doc)
        })?;
        let mut out = Vec::new();
        for row in rows {
            out.push(parse_product(&row?)?);
        }
        Ok(out)
    }

    pub fn list_all_products(&self) -> anyhow::Result<Vec<Product>> {
        let conn = self.conn.lock().unwrap();
        let mut stmt =
            conn.prepare("SELECT doc FROM products ORDER BY json_extract(doc, '$.name.en') ASC")?;
        let rows = stmt.query_map([], |r| r.get::<_, String>(0))?;
        let mut out = Vec::new();
        for row in rows {
            out.push(parse_product(&row?)?);
        }
        Ok(out)
    }

    pub fn find_product(&self, id: &str, active_only: bool) -> anyhow::Result<Option<Product>> {
        let conn = self.conn.lock().unwrap();
        let sql = if active_only {
            "SELECT doc FROM products WHERE id = ?1 AND active = 1"
        } else {
            "SELECT doc FROM products WHERE id = ?1"
        };
        let doc: Option<String> = conn
            .query_row(sql, params![id], |r| r.get(0))
            .optional()?;
        Ok(doc.map(|d| parse_product(&d)).transpose()?)
    }

    pub fn create_product(&self, body: ProductBody) -> anyhow::Result<Product> {
        let now = Utc::now();
        let product = Product {
            id: Uuid::new_v4().to_string(),
            name: body.name,
            description: body.description,
            image_url: body.image_url,
            variants: body
                .variants
                .into_iter()
                .map(|v| ProductVariant {
                    id: v.id.unwrap_or_else(|| Uuid::new_v4().to_string()),
                    sku: v.sku,
                    attributes: v.attributes,
                    prices: v.prices,
                    stock: v.stock,
                    active: v.active.unwrap_or(true),
                })
                .collect(),
            active: body.active.unwrap_or(true),
            created_at: now,
            updated_at: now,
        };
        let conn = self.conn.lock().unwrap();
        insert_product(&conn, &product)?;
        Ok(product)
    }

    pub fn update_product(&self, id: &str, body: ProductBody) -> anyhow::Result<Option<(Product, Product)>> {
        let conn = self.conn.lock().unwrap();
        let existing = match conn
            .query_row("SELECT doc FROM products WHERE id = ?1", params![id], |r| {
                r.get::<_, String>(0)
            })
            .optional()?
        {
            Some(d) => parse_product(&d)?,
            None => return Ok(None),
        };
        let before = existing.clone();
        let product = Product {
            id: existing.id,
            name: body.name,
            description: body.description,
            image_url: body.image_url,
            variants: body
                .variants
                .into_iter()
                .map(|v| ProductVariant {
                    id: v.id.unwrap_or_else(|| Uuid::new_v4().to_string()),
                    sku: v.sku,
                    attributes: v.attributes,
                    prices: v.prices,
                    stock: v.stock,
                    active: v.active.unwrap_or(true),
                })
                .collect(),
            active: body.active.unwrap_or(existing.active),
            created_at: existing.created_at,
            updated_at: Utc::now(),
        };
        let doc = serde_json::to_string(&product)?;
        conn.execute(
            "UPDATE products SET doc = ?1, active = ?2, updated_at = ?3 WHERE id = ?4",
            params![
                doc,
                product.active as i64,
                product.updated_at.to_rfc3339(),
                id
            ],
        )?;
        Ok(Some((before, product)))
    }

    pub fn find_user_by_login(&self, login: &str) -> anyhow::Result<Option<User>> {
        let conn = self.conn.lock().unwrap();
        let doc: Option<String> = conn
            .query_row("SELECT doc FROM users WHERE login = ?1", params![login], |r| {
                r.get(0)
            })
            .optional()?;
        Ok(doc.map(|d| parse_user(&d)).transpose()?)
    }

    pub fn find_user_by_id(&self, id: &str) -> anyhow::Result<Option<User>> {
        let conn = self.conn.lock().unwrap();
        let doc: Option<String> = conn
            .query_row("SELECT doc FROM users WHERE id = ?1", params![id], |r| r.get(0))
            .optional()?;
        Ok(doc.map(|d| parse_user(&d)).transpose()?)
    }

    pub fn verify_login(&self, login: &str, password: &str) -> anyhow::Result<Option<User>> {
        let user = self.find_user_by_login(login)?;
        Ok(user.filter(|u| verify_password(password, &u.password_hash) && u.role == "admin"))
    }

    pub fn update_password(
        &self,
        id: &str,
        current: &str,
        new_password: &str,
    ) -> anyhow::Result<Option<(User, User)>> {
        if new_password.len() < 12 {
            anyhow::bail!("Password must contain at least 12 characters.");
        }
        let conn = self.conn.lock().unwrap();
        let existing = match conn
            .query_row("SELECT doc FROM users WHERE id = ?1", params![id], |r| {
                r.get::<_, String>(0)
            })
            .optional()?
        {
            Some(d) => parse_user(&d)?,
            None => return Ok(None),
        };
        if !verify_password(current, &existing.password_hash) {
            return Ok(None);
        }
        let before = existing.clone();
        let updated = User {
            password_hash: hash_password(new_password),
            token_version: existing.token_version + 1,
            updated_at: Utc::now(),
            ..existing
        };
        let doc = serde_json::to_string(&updated)?;
        conn.execute("UPDATE users SET doc = ?1 WHERE id = ?2", params![doc, id])?;
        Ok(Some((before, updated)))
    }

    pub fn revoke_token(&self, jti: &str, expires_at: chrono::DateTime<Utc>) -> anyhow::Result<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute(
            "INSERT OR REPLACE INTO revoked_tokens (jti, expires_at) VALUES (?1, ?2)",
            params![jti, expires_at.to_rfc3339()],
        )?;
        Ok(())
    }

    pub fn is_revoked(&self, jti: &str) -> anyhow::Result<bool> {
        let conn = self.conn.lock().unwrap();
        let n: i64 = conn.query_row(
            "SELECT COUNT(*) FROM revoked_tokens WHERE jti = ?1",
            params![jti],
            |r| r.get(0),
        )?;
        Ok(n > 0)
    }

    pub fn record_audit(
        &self,
        user_id: &str,
        action: &str,
        entity_type: &str,
        entity_id: &str,
        before: Option<serde_json::Value>,
        after: Option<serde_json::Value>,
    ) -> anyhow::Result<()> {
        let log = AuditLog {
            id: Uuid::new_v4().to_string(),
            user_id: user_id.to_string(),
            action: action.to_string(),
            entity_type: entity_type.to_string(),
            entity_id: entity_id.to_string(),
            before,
            after,
            created_at: Utc::now(),
        };
        let conn = self.conn.lock().unwrap();
        let doc = serde_json::to_string(&log)?;
        conn.execute(
            "INSERT INTO audit_logs (id, doc, created_at) VALUES (?1, ?2, ?3)",
            params![log.id, doc, log.created_at.to_rfc3339()],
        )?;
        Ok(())
    }

    pub fn find_audit(&self, action: &str, entity_id: &str) -> anyhow::Result<Option<AuditLog>> {
        let conn = self.conn.lock().unwrap();
        let doc: Option<String> = conn
            .query_row(
                "SELECT doc FROM audit_logs WHERE json_extract(doc, '$.action') = ?1 AND json_extract(doc, '$.entityId') = ?2 LIMIT 1",
                params![action, entity_id],
                |r| r.get(0),
            )
            .optional()?;
        Ok(doc.map(|d| serde_json::from_str(&d)).transpose()?)
    }

    pub fn create_order(&self, body: OrderBody) -> anyhow::Result<Result<Order, CreateOrderFail>> {
        let locale = body.lang.as_deref().unwrap_or("en");
        let currency = if body.address.country.eq_ignore_ascii_case("BR") {
            "BRL"
        } else {
            "USD"
        };
        let conn = self.conn.lock().unwrap();
        let tx = conn.unchecked_transaction()?;
        let mut items = Vec::new();
        for item in &body.items {
            let doc: Option<String> = tx
                .query_row(
                    "SELECT doc FROM products WHERE id = ?1 AND active = 1",
                    params![item.product_id],
                    |r| r.get(0),
                )
                .optional()?;
            let Some(doc) = doc else {
                return Ok(Err(CreateOrderFail {
                    code: "PRODUCT_NOT_FOUND",
                    details: serde_json::json!({ "productId": item.product_id }),
                }));
            };
            let mut product = parse_product(&doc)?;
            let Some(variant) = product
                .variants
                .iter_mut()
                .find(|v| v.id == item.variant_id && v.active)
            else {
                return Ok(Err(CreateOrderFail {
                    code: "VARIANT_NOT_FOUND",
                    details: serde_json::json!({
                        "productId": item.product_id,
                        "variantId": item.variant_id
                    }),
                }));
            };
            if variant.stock < item.quantity {
                return Ok(Err(CreateOrderFail {
                    code: "INSUFFICIENT_STOCK",
                    details: serde_json::json!({
                        "productId": item.product_id,
                        "variantId": item.variant_id,
                        "availableStock": variant.stock
                    }),
                }));
            }
            variant.stock -= item.quantity;
            product.updated_at = Utc::now();
            let unit = if currency == "BRL" {
                variant.prices.brl_cents
            } else {
                variant.prices.usd_cents
            };
            items.push(OrderItem {
                product_id: product.id.clone(),
                variant_id: variant.id.clone(),
                sku: variant.sku.clone(),
                name: product.name.get(locale).to_string(),
                quantity: item.quantity,
                unit_price_cents: unit,
                subtotal_cents: unit * item.quantity,
            });
            let pdoc = serde_json::to_string(&product)?;
            tx.execute(
                "UPDATE products SET doc = ?1, updated_at = ?2 WHERE id = ?3",
                params![pdoc, product.updated_at.to_rfc3339(), product.id],
            )?;
        }
        let now = Utc::now();
        let mut address = body.address.clone();
        address.country = address.country.to_uppercase();
        let order = Order {
            id: Uuid::new_v4().to_string(),
            status: "pending".into(),
            contact: body.contact,
            address,
            total_cents: items.iter().map(|i| i.subtotal_cents).sum(),
            items,
            currency: currency.into(),
            created_at: now,
            updated_at: now,
        };
        let doc = serde_json::to_string(&order)?;
        tx.execute(
            "INSERT INTO orders (id, doc, status, contact_email, created_at) VALUES (?1, ?2, ?3, ?4, ?5)",
            params![
                order.id,
                doc,
                order.status,
                order.contact.email,
                order.created_at.to_rfc3339()
            ],
        )?;
        tx.commit()?;
        Ok(Ok(order))
    }

    pub fn list_orders(&self) -> anyhow::Result<Vec<Order>> {
        let conn = self.conn.lock().unwrap();
        let mut stmt =
            conn.prepare("SELECT doc FROM orders ORDER BY created_at DESC")?;
        let rows = stmt.query_map([], |r| r.get::<_, String>(0))?;
        let mut out = Vec::new();
        for row in rows {
            out.push(parse_order(&row?)?);
        }
        Ok(out)
    }

    pub fn find_order(&self, id: &str) -> anyhow::Result<Option<Order>> {
        let conn = self.conn.lock().unwrap();
        let doc: Option<String> = conn
            .query_row("SELECT doc FROM orders WHERE id = ?1", params![id], |r| r.get(0))
            .optional()?;
        Ok(doc.map(|d| parse_order(&d)).transpose()?)
    }

    pub fn update_order_status(
        &self,
        id: &str,
        status: &str,
        user_id: &str,
    ) -> anyhow::Result<Option<()>> {
        let conn = self.conn.lock().unwrap();
        let doc: Option<String> = conn
            .query_row("SELECT doc FROM orders WHERE id = ?1", params![id], |r| r.get(0))
            .optional()?;
        let Some(doc) = doc else {
            return Ok(None);
        };
        let mut order = parse_order(&doc)?;
        let before = serde_json::json!({ "status": order.status });
        order.status = status.to_string();
        order.updated_at = Utc::now();
        let after = serde_json::json!({ "status": order.status });
        let new_doc = serde_json::to_string(&order)?;
        conn.execute(
            "UPDATE orders SET doc = ?1, status = ?2 WHERE id = ?3",
            params![new_doc, order.status, id],
        )?;
        drop(conn);
        self.record_audit(
            user_id,
            "order.status.update",
            "order",
            id,
            Some(before),
            Some(after),
        )?;
        Ok(Some(()))
    }
}

pub struct CreateOrderFail {
    pub code: &'static str,
    pub details: serde_json::Value,
}

fn insert_product(conn: &Connection, product: &Product) -> anyhow::Result<()> {
    let doc = serde_json::to_string(product)?;
    conn.execute(
        "INSERT INTO products (id, doc, active, updated_at) VALUES (?1, ?2, ?3, ?4)",
        params![
            product.id,
            doc,
            product.active as i64,
            product.updated_at.to_rfc3339()
        ],
    )?;
    Ok(())
}

fn find_admin(conn: &Connection) -> anyhow::Result<Option<User>> {
    let doc: Option<String> = conn
        .query_row(
            "SELECT doc FROM users WHERE json_extract(doc, '$.role') = 'admin' LIMIT 1",
            [],
            |r| r.get(0),
        )
        .optional()?;
    Ok(doc.map(|d| parse_user(&d)).transpose()?)
}

fn parse_product(doc: &str) -> anyhow::Result<Product> {
    Ok(serde_json::from_str(doc)?)
}

fn parse_user(doc: &str) -> anyhow::Result<User> {
    Ok(serde_json::from_str(doc)?)
}

fn parse_order(doc: &str) -> anyhow::Result<Order> {
    Ok(serde_json::from_str(doc)?)
}
