//! Contract tests ported from apps/api/src/http/routes.test.ts
use arateki_api::auth::Claims;
use arateki_api::build_app;
use axum::body::Body;
use axum::http::{Request, StatusCode};
use http_body_util::BodyExt;
use jsonwebtoken::{encode, EncodingKey, Header};
use serde_json::{json, Value};
use tower::ServiceExt;
use uuid::Uuid;

async fn setup() -> (axum::Router, arateki_api::AppState) {
    let (app, state) = build_app(
        ":memory:",
        "test-secret",
        3600,
        Some("https://arateki.test".into()),
        "admin",
        "admin-password",
    )
    .expect("build app");
    (app, state)
}

async fn json_request(
    app: axum::Router,
    method: &str,
    uri: &str,
    body: Option<Value>,
    token: Option<&str>,
) -> (StatusCode, Value, axum::Router, String) {
    let mut builder = Request::builder().method(method).uri(uri);
    if let Some(t) = token {
        builder = builder.header("authorization", format!("Bearer {t}"));
    }
    let req = if let Some(b) = body {
        builder
            .header("content-type", "application/json")
            .body(Body::from(b.to_string()))
            .unwrap()
    } else {
        builder.body(Body::empty()).unwrap()
    };
    let response = app.clone().oneshot(req).await.unwrap();
    let status = response.status();
    let bytes = response.into_body().collect().await.unwrap().to_bytes();
    let text = String::from_utf8_lossy(&bytes).to_string();
    let json: Value = if text.is_empty() {
        Value::Null
    } else {
        serde_json::from_str(&text).unwrap_or(Value::String(text.clone()))
    };
    (status, json, app, text)
}

fn sign_admin(state: &arateki_api::AppState, token_version: i64) -> String {
    let now = chrono::Utc::now().timestamp();
    let claims = Claims {
        sub: state.admin_user_id.clone(),
        role: "admin".into(),
        token_version,
        jti: Uuid::new_v4().to_string(),
        iat: now,
        exp: now + 3600,
    };
    encode(
        &Header::default(),
        &claims,
        &EncodingKey::from_secret(b"test-secret"),
    )
    .unwrap()
}

fn new_product_payload() -> Value {
    json!({
        "name": {
            "pt": "Sonda de pH",
            "en": "pH Probe",
            "es": "Sonda de pH",
            "zh": "pH 探头",
            "ja": "pHプローブ"
        },
        "description": {
            "pt": "Sonda de pH para monitoramento hidropônico.",
            "en": "pH probe for hydroponic monitoring setups.",
            "es": "Sonda de pH para monitoreo hidropónico.",
            "zh": "用于水培监测的 pH 探头。",
            "ja": "水耕モニタリング向けのpHプローブです。"
        },
        "variants": [{
            "sku": "PH-PROBE-STANDARD",
            "attributes": { "kind": "standard" },
            "prices": { "brlCents": 12990, "usdCents": 2499 },
            "stock": 12
        }]
    })
}

fn new_order_payload() -> Value {
    json!({
        "contact": {
            "name": "Maria Silva",
            "email": "maria@example.com",
            "phone": "+55 11 99999-0000"
        },
        "address": {
            "country": "BR",
            "postalCode": "01310-100",
            "state": "SP",
            "city": "São Paulo",
            "line1": "Av. Paulista 1000"
        },
        "items": [{
            "productId": "esp32-wroom-32d",
            "variantId": "esp32-wroom-32d-default",
            "quantity": 2
        }],
        "lang": "pt"
    })
}

#[tokio::test]
async fn does_not_expose_unprefixed_routes() {
    let (app, _) = setup().await;
    let (s1, _, app, _) = json_request(app, "GET", "/products", None, None).await;
    let (s2, _, _, _) = json_request(app, "POST", "/login", Some(json!({"login":"a","password":"b"})), None).await;
    assert_eq!(s1, StatusCode::NOT_FOUND);
    assert_eq!(s2, StatusCode::NOT_FOUND);
}

#[tokio::test]
async fn lists_products_publicly() {
    let (app, _) = setup().await;
    let (status, body, _, _) = json_request(app, "GET", "/api/products", None, None).await;
    assert_eq!(status, StatusCode::OK);
    let products = body["products"].as_array().unwrap();
    assert_eq!(products[0]["id"], "sensor-dht22");
    assert_eq!(products[0]["name"], "DHT22 SENSOR");
    assert_eq!(products[1]["id"], "esp32-wroom-32d");
}

#[tokio::test]
async fn health_and_brl_products() {
    let (app, _) = setup().await;
    let (hs, hb, app, _) = json_request(app, "GET", "/api/health", None, None).await;
    assert_eq!(hs, StatusCode::OK);
    assert_eq!(hb["status"], "ok");
    let (ps, pb, _, _) =
        json_request(app, "GET", "/api/products?country=BR&lang=pt", None, None).await;
    assert_eq!(ps, StatusCode::OK);
    assert_eq!(pb["products"][0]["currency"], "BRL");
}

#[tokio::test]
async fn currency_and_language() {
    let (app, _) = setup().await;
    let (_, br, app, _) =
        json_request(app, "GET", "/api/products?country=BR&lang=pt", None, None).await;
    let (_, us, _, _) = json_request(app, "GET", "/api/products?country=US", None, None).await;
    let br_dht = br["products"]
        .as_array()
        .unwrap()
        .iter()
        .find(|p| p["id"] == "sensor-dht22")
        .unwrap();
    assert_eq!(br_dht["priceCents"], 3290);
    assert_eq!(br_dht["currency"], "BRL");
    let us_dht = us["products"]
        .as_array()
        .unwrap()
        .iter()
        .find(|p| p["id"] == "sensor-dht22")
        .unwrap();
    assert_eq!(us_dht["priceCents"], 649);
    assert_eq!(us_dht["currency"], "USD");
}

#[tokio::test]
async fn google_shopping_feed() {
    let (app, _) = setup().await;
    let (status, _, _, text) = json_request(
        app,
        "GET",
        "/api/feeds/google-shopping.xml?country=BR&lang=pt",
        None,
        None,
    )
    .await;
    assert_eq!(status, StatusCode::OK);
    assert!(text.contains(r#"xmlns:g="http://base.google.com/ns/1.0""#));
    assert!(text.contains("<g:id>sensor-dht22</g:id>"));
    assert!(text.contains("<title>SENSOR DHT22</title>"));
    assert!(text.contains("<g:price>32.90 BRL</g:price>"));
    assert!(text.contains("<g:brand>Arateki</g:brand>"));
    assert!(text.contains("<g:mpn>SENSOR-DHT22</g:mpn>"));
    assert!(text.contains("https://arateki.test/pt/sales/sensor-dht22"));
}

#[tokio::test]
async fn sitemap_multilang() {
    let (app, _) = setup().await;
    let (status, _, _, text) = json_request(app, "GET", "/api/sitemap.xml", None, None).await;
    assert_eq!(status, StatusCode::OK);
    assert!(text.contains("https://arateki.test/pt"));
    assert!(text.contains("https://arateki.test/en/sales/sensor-dht22"));
    assert!(text.contains(r#"hreflang="pt-BR""#));
    assert!(text.contains(r#"hreflang="x-default""#));
    assert!(text.contains("<priority>1.0</priority>"));
}

#[tokio::test]
async fn spreadsheet_feeds() {
    let (app, _) = setup().await;
    let (s1, _, app, tsv) = json_request(
        app,
        "GET",
        "/api/feeds/products.tsv?country=US&lang=en",
        None,
        None,
    )
    .await;
    assert_eq!(s1, StatusCode::OK);
    assert!(tsv.starts_with("id\ttitle\tdescription\tavailability"));
    assert!(tsv.contains("sensor-dht22\tDHT22 SENSOR\tDigital temperature"));
    let (s2, _, _, csv) = json_request(
        app,
        "GET",
        "/api/feeds/meta-catalog.csv?country=US&lang=en",
        None,
        None,
    )
    .await;
    assert_eq!(s2, StatusCode::OK);
    assert!(csv.starts_with("id,title,description,availability"));
    assert!(csv.contains(r#""sensor-dht22","DHT22 SENSOR""#));
}

#[tokio::test]
async fn login_and_reject() {
    let (app, _) = setup().await;
    let (ok, body, app, _) = json_request(
        app,
        "POST",
        "/api/login",
        Some(json!({"login":"admin","password":"admin-password"})),
        None,
    )
    .await;
    assert_eq!(ok, StatusCode::OK);
    assert!(body["token"].as_str().unwrap().len() > 10);
    let (bad, _, _, _) = json_request(
        app,
        "POST",
        "/api/login",
        Some(json!({"login":"admin","password":"wrong-password"})),
        None,
    )
    .await;
    assert_eq!(bad, StatusCode::UNAUTHORIZED);
}

#[tokio::test]
async fn product_create_requires_admin() {
    let (app, _) = setup().await;
    let (s, _, _, _) =
        json_request(app, "POST", "/api/products", Some(new_product_payload()), None).await;
    assert_eq!(s, StatusCode::UNAUTHORIZED);
}

#[tokio::test]
async fn create_order_public() {
    let (app, _) = setup().await;
    let (s, body, _, _) =
        json_request(app, "POST", "/api/orders", Some(new_order_payload()), None).await;
    assert_eq!(s, StatusCode::CREATED);
    assert_eq!(body["order"]["status"], "pending");
    assert_eq!(body["order"]["currency"], "BRL");
    assert_eq!(body["order"]["totalCents"], 9180);
}

#[tokio::test]
async fn reject_invalid_variant() {
    let (app, _) = setup().await;
    let mut payload = new_order_payload();
    payload["items"] = json!([{"productId":"esp32-wroom-32d","variantId":"missing","quantity":1}]);
    let (s, body, _, _) = json_request(app, "POST", "/api/orders", Some(payload), None).await;
    assert_eq!(s, StatusCode::BAD_REQUEST);
    assert_eq!(body["message"], "VARIANT_NOT_FOUND");
}

#[tokio::test]
async fn create_product_with_jwt() {
    let (app, state) = setup().await;
    let token = sign_admin(&state, 0);
    let (s, body, _, _) = json_request(
        app,
        "POST",
        "/api/products",
        Some(new_product_payload()),
        Some(&token),
    )
    .await;
    assert_eq!(s, StatusCode::CREATED);
    assert_eq!(body["product"]["variants"][0]["sku"], "PH-PROBE-STANDARD");
    assert_eq!(body["product"]["active"], true);
}

#[tokio::test]
async fn logout_revokes_token() {
    let (app, state) = setup().await;
    let token = sign_admin(&state, 0);
    let (ls, _, app, _) = json_request(app, "POST", "/api/logout", None, Some(&token)).await;
    assert_eq!(ls, StatusCode::NO_CONTENT);
    let (s, _, _, _) = json_request(
        app,
        "POST",
        "/api/products",
        Some(new_product_payload()),
        Some(&token),
    )
    .await;
    assert_eq!(s, StatusCode::UNAUTHORIZED);
}

#[tokio::test]
async fn me_and_refresh() {
    let (app, state) = setup().await;
    let token = sign_admin(&state, 0);
    let (ms, mb, app, _) = json_request(app, "GET", "/api/me", None, Some(&token)).await;
    assert_eq!(ms, StatusCode::OK);
    assert_eq!(mb["user"]["id"], state.admin_user_id);
    let (rs, rb, app, _) = json_request(app, "POST", "/api/refresh", None, Some(&token)).await;
    assert_eq!(rs, StatusCode::OK);
    let new_token = rb["token"].as_str().unwrap().to_string();
    let (old, _, app, _) = json_request(app, "GET", "/api/me", None, Some(&token)).await;
    assert_eq!(old, StatusCode::UNAUTHORIZED);
    let (ok, _, _, _) = json_request(app, "GET", "/api/me", None, Some(&new_token)).await;
    assert_eq!(ok, StatusCode::OK);
}

#[tokio::test]
async fn change_password_invalidates_token() {
    let (app, state) = setup().await;
    let token = sign_admin(&state, 0);
    let (cs, _, app, _) = json_request(
        app,
        "PATCH",
        "/api/users/password",
        Some(json!({
            "currentPassword": "admin-password",
            "newPassword": "new-admin-password"
        })),
        Some(&token),
    )
    .await;
    assert_eq!(cs, StatusCode::NO_CONTENT);
    let (old, _, app, _) = json_request(
        app,
        "POST",
        "/api/products",
        Some(new_product_payload()),
        Some(&token),
    )
    .await;
    assert_eq!(old, StatusCode::UNAUTHORIZED);
    let (login, _, _, _) = json_request(
        app,
        "POST",
        "/api/login",
        Some(json!({"login":"admin","password":"new-admin-password"})),
        None,
    )
    .await;
    assert_eq!(login, StatusCode::OK);
    let audit = state
        .store
        .find_audit("user.password.change", &state.admin_user_id)
        .unwrap()
        .expect("audit");
    assert_eq!(audit.action, "user.password.change");
}

#[tokio::test]
async fn admin_order_lifecycle() {
    let (app, state) = setup().await;
    // password still admin-password in fresh app
    let (ls, lb, app, _) = json_request(
        app,
        "POST",
        "/api/login",
        Some(json!({"login":"admin","password":"admin-password"})),
        None,
    )
    .await;
    assert_eq!(ls, StatusCode::OK);
    let token = lb["token"].as_str().unwrap().to_string();

    let (cs, cb, app, _) =
        json_request(app, "POST", "/api/orders", Some(new_order_payload()), None).await;
    assert_eq!(cs, StatusCode::CREATED);
    let order_id = cb["order"]["id"].as_str().unwrap().to_string();

    let (list_s, list_b, app, _) =
        json_request(app, "GET", "/api/orders", None, Some(&token)).await;
    assert_eq!(list_s, StatusCode::OK);
    assert!(list_b["orders"]
        .as_array()
        .unwrap()
        .iter()
        .any(|o| o["id"] == order_id));

    let (gs, gb, app, _) = json_request(
        app,
        "GET",
        &format!("/api/orders/{order_id}"),
        None,
        Some(&token),
    )
    .await;
    assert_eq!(gs, StatusCode::OK);
    assert_eq!(gb["order"]["status"], "pending");

    let (ps, _, app, _) = json_request(
        app,
        "PATCH",
        &format!("/api/orders/{order_id}/status"),
        Some(json!({"status":"paid"})),
        Some(&token),
    )
    .await;
    assert_eq!(ps, StatusCode::NO_CONTENT);

    let (vs, vb, _, _) = json_request(
        app,
        "GET",
        &format!("/api/orders/{order_id}"),
        None,
        Some(&token),
    )
    .await;
    assert_eq!(vs, StatusCode::OK);
    assert_eq!(vb["order"]["status"], "paid");

    let audit = state
        .store
        .find_audit("order.status.update", &order_id)
        .unwrap()
        .expect("audit");
    assert_eq!(audit.before.unwrap()["status"], "pending");
    assert_eq!(audit.after.unwrap()["status"], "paid");
}

#[tokio::test]
async fn admin_product_manage() {
    let (app, state) = setup().await;
    let token = sign_admin(&state, 0);
    let (ls, lb, app, _) =
        json_request(app, "GET", "/api/admin/products", None, Some(&token)).await;
    assert_eq!(ls, StatusCode::OK);
    let products = lb["products"].as_array().unwrap();
    assert!(!products.is_empty());
    let target = &products[0];
    let id = target["id"].as_str().unwrap();

    let (gs, _, app, _) = json_request(
        app,
        "GET",
        &format!("/api/admin/products/{id}"),
        None,
        Some(&token),
    )
    .await;
    assert_eq!(gs, StatusCode::OK);

    let (missing, _, app, _) = json_request(
        app,
        "GET",
        "/api/admin/products/non-existent-id",
        None,
        Some(&token),
    )
    .await;
    assert_eq!(missing, StatusCode::NOT_FOUND);

    let (unauth, _, app, _) =
        json_request(app, "GET", &format!("/api/admin/products/{id}"), None, None).await;
    assert_eq!(unauth, StatusCode::UNAUTHORIZED);

    let mut update = target.clone();
    update["name"]["pt"] = json!("NOME ATUALIZADO");
    // convert to product body shape
    let payload = json!({
        "name": update["name"],
        "description": update["description"],
        "variants": update["variants"].as_array().unwrap().iter().map(|v| json!({
            "id": v["id"],
            "sku": v["sku"],
            "attributes": v["attributes"],
            "prices": {
                "brlCents": v["prices"]["brlCents"],
                "usdCents": 9999
            },
            "stock": v["stock"],
            "active": v["active"]
        })).collect::<Vec<_>>(),
    });
    let (us, ub, app, _) = json_request(
        app,
        "PUT",
        &format!("/api/products/{id}"),
        Some(payload),
        Some(&token),
    )
    .await;
    assert_eq!(us, StatusCode::OK);
    assert_eq!(ub["product"]["name"]["pt"], "NOME ATUALIZADO");

    let (_, pub_b, _, _) = json_request(app, "GET", "/api/products?lang=pt", None, None).await;
    let updated = pub_b["products"]
        .as_array()
        .unwrap()
        .iter()
        .find(|p| p["id"] == id)
        .unwrap();
    assert_eq!(updated["name"], "NOME ATUALIZADO");
    assert_eq!(updated["priceCents"], 9999);
}

#[tokio::test]
async fn not_found_updates() {
    let (app, state) = setup().await;
    let token = sign_admin(&state, 0);
    let (ps, _, app, _) = json_request(
        app,
        "PUT",
        "/api/products/non-existent-id",
        Some(new_product_payload()),
        Some(&token),
    )
    .await;
    assert_eq!(ps, StatusCode::NOT_FOUND);
    let (os, _, _, _) = json_request(
        app,
        "PATCH",
        "/api/orders/non-existent-id/status",
        Some(json!({"status":"paid"})),
        Some(&token),
    )
    .await;
    assert_eq!(os, StatusCode::NOT_FOUND);
}

#[tokio::test]
async fn orders_require_admin() {
    let (app, _) = setup().await;
    let (s, _, _, _) = json_request(app, "GET", "/api/orders", None, None).await;
    assert_eq!(s, StatusCode::UNAUTHORIZED);
}
