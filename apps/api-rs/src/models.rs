use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

pub type Locale = String; // pt|en|es|zh|ja
pub type Currency = String; // BRL|USD

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LocalizedText {
    pub pt: String,
    pub en: String,
    pub es: String,
    pub zh: String,
    pub ja: String,
}

impl LocalizedText {
    pub fn get(&self, locale: &str) -> &str {
        match locale {
            "pt" => &self.pt,
            "es" => &self.es,
            "zh" => &self.zh,
            "ja" => &self.ja,
            _ => &self.en,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ProductPrices {
    pub brl_cents: i64,
    pub usd_cents: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ProductVariant {
    pub id: String,
    pub sku: String,
    pub attributes: HashMap<String, String>,
    pub prices: ProductPrices,
    pub stock: i64,
    pub active: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Product {
    pub id: String,
    pub name: LocalizedText,
    pub description: LocalizedText,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub image_url: Option<String>,
    pub variants: Vec<ProductVariant>,
    pub active: bool,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ProductVariantView {
    pub id: String,
    pub sku: String,
    pub attributes: HashMap<String, String>,
    pub price_cents: i64,
    pub currency: Currency,
    pub stock: i64,
    pub active: bool,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ProductView {
    pub id: String,
    pub name: String,
    pub description: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub image_url: Option<String>,
    pub price_cents: i64,
    pub currency: Currency,
    pub stock: i64,
    pub variants: Vec<ProductVariantView>,
    pub active: bool,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

pub fn to_product_view(product: &Product, currency: &str, locale: &str) -> ProductView {
    let variants: Vec<ProductVariantView> = product
        .variants
        .iter()
        .filter(|v| v.active)
        .map(|v| ProductVariantView {
            id: v.id.clone(),
            sku: v.sku.clone(),
            attributes: v.attributes.clone(),
            price_cents: if currency == "BRL" {
                v.prices.brl_cents
            } else {
                v.prices.usd_cents
            },
            currency: currency.to_string(),
            stock: v.stock,
            active: v.active,
        })
        .collect();
    let price_cents = variants.iter().map(|v| v.price_cents).min().unwrap_or(0);
    let stock = variants.iter().map(|v| v.stock).sum();
    ProductView {
        id: product.id.clone(),
        name: product.name.get(locale).to_string(),
        description: product.description.get(locale).to_string(),
        image_url: product.image_url.clone(),
        price_cents,
        currency: currency.to_string(),
        stock,
        variants,
        active: product.active,
        created_at: product.created_at,
        updated_at: product.updated_at,
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct User {
    pub id: String,
    pub login: String,
    pub password_hash: String,
    pub role: String,
    pub token_version: i64,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct OrderContact {
    pub name: String,
    pub email: String,
    pub phone: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct OrderAddress {
    pub country: String,
    pub postal_code: String,
    pub state: String,
    pub city: String,
    pub line1: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub line2: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct OrderItem {
    pub product_id: String,
    pub variant_id: String,
    pub sku: String,
    pub name: String,
    pub quantity: i64,
    pub unit_price_cents: i64,
    pub subtotal_cents: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Order {
    pub id: String,
    pub status: String,
    pub contact: OrderContact,
    pub address: OrderAddress,
    pub items: Vec<OrderItem>,
    pub currency: Currency,
    pub total_cents: i64,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AuditLog {
    pub id: String,
    pub user_id: String,
    pub action: String,
    pub entity_type: String,
    pub entity_id: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub before: Option<serde_json::Value>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub after: Option<serde_json::Value>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct LoginBody {
    pub login: String,
    pub password: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ChangePasswordBody {
    pub current_password: String,
    pub new_password: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ProductVariantInput {
    pub id: Option<String>,
    pub sku: String,
    pub attributes: HashMap<String, String>,
    pub prices: ProductPrices,
    pub stock: i64,
    pub active: Option<bool>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ProductBody {
    pub name: LocalizedText,
    pub description: LocalizedText,
    pub image_url: Option<String>,
    pub variants: Vec<ProductVariantInput>,
    pub active: Option<bool>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct OrderItemInput {
    pub product_id: String,
    pub variant_id: String,
    pub quantity: i64,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct OrderBody {
    pub contact: OrderContact,
    pub address: OrderAddress,
    pub items: Vec<OrderItemInput>,
    pub lang: Option<String>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct StatusBody {
    pub status: String,
}
