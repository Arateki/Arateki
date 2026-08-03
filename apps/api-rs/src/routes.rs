use crate::auth::{authenticate_admin, AuthError, JwtKeys};
use crate::db::Store;
use crate::feeds::{
    build_google_shopping_xml, build_meta_catalog_csv, build_products_tsv, build_sitemap_xml,
};
use crate::models::*;
use axum::extract::{Path, Query, State};
use axum::http::{header, HeaderMap, StatusCode};
use axum::response::{IntoResponse, Response};
use axum::routing::{get, patch, post, put};
use axum::{Json, Router};
use chrono::{TimeZone, Utc};
use serde::Deserialize;
use serde_json::json;
use std::sync::Arc;

#[derive(Clone)]
pub struct AppState {
    pub store: Arc<Store>,
    pub jwt: JwtKeys,
    pub public_site_url: Option<String>,
    pub admin_user_id: String,
}

pub fn app_router(state: AppState) -> Router {
    Router::new()
        .nest(
            "/api",
            Router::new()
                .route("/health", get(health))
                .route("/products", get(list_products).post(create_product))
                .route("/products/{id}", put(update_product))
                .route("/admin/products", get(list_admin_products))
                .route("/admin/products/{id}", get(get_admin_product))
                .route("/login", post(login))
                .route("/me", get(me))
                .route("/refresh", post(refresh))
                .route("/logout", post(logout))
                .route("/users/password", patch(change_password))
                .route("/orders", get(list_orders).post(create_order))
                .route("/orders/{id}", get(get_order))
                .route("/orders/{id}/status", patch(update_order_status))
                .route(
                    "/feeds/google-shopping.xml",
                    get(feed_google),
                )
                .route("/feeds/products.tsv", get(feed_tsv))
                .route("/feeds/meta-catalog.csv", get(feed_csv))
                .route("/sitemap.xml", get(sitemap)),
        )
        .with_state(state)
}

async fn health() -> Json<serde_json::Value> {
    Json(json!({ "status": "ok" }))
}

#[derive(Debug, Deserialize)]
struct ProductQuery {
    country: Option<String>,
    lang: Option<String>,
}

fn currency_locale(q: &ProductQuery) -> (String, String) {
    let currency = if q
        .country
        .as_deref()
        .map(|c| c.eq_ignore_ascii_case("BR"))
        .unwrap_or(false)
    {
        "BRL"
    } else {
        "USD"
    };
    let locale = q.lang.clone().unwrap_or_else(|| "en".into());
    (currency.into(), locale)
}

async fn list_products(
    State(state): State<AppState>,
    Query(q): Query<ProductQuery>,
) -> Result<Json<serde_json::Value>, ApiError> {
    let (currency, locale) = currency_locale(&q);
    let products = state.store.list_active_products()?;
    let views: Vec<_> = products
        .iter()
        .map(|p| to_product_view(p, &currency, &locale))
        .collect();
    Ok(Json(json!({ "products": views })))
}

async fn list_admin_products(
    State(state): State<AppState>,
    headers: HeaderMap,
) -> Result<Json<serde_json::Value>, ApiError> {
    require_admin(&state, &headers)?;
    let products = state.store.list_all_products()?;
    Ok(Json(json!({ "products": products })))
}

async fn get_admin_product(
    State(state): State<AppState>,
    headers: HeaderMap,
    Path(id): Path<String>,
) -> Result<Json<serde_json::Value>, ApiError> {
    require_admin(&state, &headers)?;
    match state.store.find_product(&id, false)? {
        Some(p) => Ok(Json(json!({ "product": p }))),
        None => Err(ApiError::not_found("Product not found")),
    }
}

async fn create_product(
    State(state): State<AppState>,
    headers: HeaderMap,
    Json(body): Json<ProductBody>,
) -> Result<(StatusCode, Json<serde_json::Value>), ApiError> {
    let admin = require_admin(&state, &headers)?;
    if body.variants.is_empty() {
        return Err(ApiError::bad_request("Invalid product payload"));
    }
    let product = state.store.create_product(body)?;
    let _ = state.store.record_audit(
        &admin.user_id,
        "product.create",
        "product",
        &product.id,
        None,
        Some(serde_json::to_value(&product)?),
    );
    Ok((StatusCode::CREATED, Json(json!({ "product": product }))))
}

async fn update_product(
    State(state): State<AppState>,
    headers: HeaderMap,
    Path(id): Path<String>,
    Json(body): Json<ProductBody>,
) -> Result<Json<serde_json::Value>, ApiError> {
    let admin = require_admin(&state, &headers)?;
    match state.store.update_product(&id, body)? {
        Some((before, after)) => {
            state.store.record_audit(
                &admin.user_id,
                "product.update",
                "product",
                &id,
                Some(serde_json::to_value(&before)?),
                Some(serde_json::to_value(&after)?),
            )?;
            Ok(Json(json!({ "product": after })))
        }
        None => Err(ApiError::not_found("Product not found")),
    }
}

async fn login(
    State(state): State<AppState>,
    Json(body): Json<LoginBody>,
) -> Result<Json<serde_json::Value>, ApiError> {
    if body.login.is_empty() || body.password.is_empty() {
        return Err(ApiError::bad_request("Invalid login payload"));
    }
    match state.store.verify_login(&body.login, &body.password)? {
        Some(user) => {
            let token = state.jwt.sign_admin(&user.id, user.token_version)?;
            Ok(Json(json!({ "token": token })))
        }
        None => Err(ApiError::unauthorized_msg("Invalid credentials")),
    }
}

async fn me(
    State(state): State<AppState>,
    headers: HeaderMap,
) -> Result<Json<serde_json::Value>, ApiError> {
    let admin = require_admin(&state, &headers)?;
    Ok(Json(json!({
        "user": { "id": admin.user_id, "role": "admin" }
    })))
}

async fn refresh(
    State(state): State<AppState>,
    headers: HeaderMap,
) -> Result<Json<serde_json::Value>, ApiError> {
    let admin = require_admin(&state, &headers)?;
    let exp = Utc.timestamp_opt(admin.exp, 0).single().unwrap_or_else(Utc::now);
    state.store.revoke_token(&admin.jti, exp)?;
    let token = state.jwt.sign_admin(&admin.user_id, admin.token_version)?;
    Ok(Json(json!({ "token": token })))
}

async fn logout(
    State(state): State<AppState>,
    headers: HeaderMap,
) -> Result<StatusCode, ApiError> {
    let admin = require_admin(&state, &headers)?;
    let exp = Utc.timestamp_opt(admin.exp, 0).single().unwrap_or_else(Utc::now);
    state.store.revoke_token(&admin.jti, exp)?;
    Ok(StatusCode::NO_CONTENT)
}

async fn change_password(
    State(state): State<AppState>,
    headers: HeaderMap,
    Json(body): Json<ChangePasswordBody>,
) -> Result<StatusCode, ApiError> {
    let admin = require_admin(&state, &headers)?;
    if body.new_password.len() < 12 {
        return Err(ApiError::bad_request("Invalid password payload"));
    }
    match state
        .store
        .update_password(&admin.user_id, &body.current_password, &body.new_password)?
    {
        Some((before, after)) => {
            state.store.record_audit(
                &admin.user_id,
                "user.password.change",
                "user",
                &admin.user_id,
                Some(json!({ "tokenVersion": before.token_version })),
                Some(json!({ "tokenVersion": after.token_version })),
            )?;
            Ok(StatusCode::NO_CONTENT)
        }
        None => Err(ApiError::unauthorized()),
    }
}

async fn create_order(
    State(state): State<AppState>,
    Json(body): Json<OrderBody>,
) -> Result<(StatusCode, Json<serde_json::Value>), ApiError> {
    if body.items.is_empty() {
        return Err(ApiError::bad_request("Invalid order payload"));
    }
    match state.store.create_order(body)? {
        Ok(order) => Ok((StatusCode::CREATED, Json(json!({ "order": order })))),
        Err(fail) => Err(ApiError::order_fail(fail.code, fail.details)),
    }
}

async fn list_orders(
    State(state): State<AppState>,
    headers: HeaderMap,
) -> Result<Json<serde_json::Value>, ApiError> {
    require_admin(&state, &headers)?;
    let orders = state.store.list_orders()?;
    Ok(Json(json!({ "orders": orders })))
}

async fn get_order(
    State(state): State<AppState>,
    headers: HeaderMap,
    Path(id): Path<String>,
) -> Result<Json<serde_json::Value>, ApiError> {
    require_admin(&state, &headers)?;
    match state.store.find_order(&id)? {
        Some(o) => Ok(Json(json!({ "order": o }))),
        None => Err(ApiError::not_found("Order not found")),
    }
}

async fn update_order_status(
    State(state): State<AppState>,
    headers: HeaderMap,
    Path(id): Path<String>,
    Json(body): Json<StatusBody>,
) -> Result<StatusCode, ApiError> {
    let admin = require_admin(&state, &headers)?;
    let allowed = ["pending", "paid", "processing", "shipped", "cancelled"];
    if !allowed.contains(&body.status.as_str()) {
        return Err(ApiError::bad_request("Invalid status payload"));
    }
    match state
        .store
        .update_order_status(&id, &body.status, &admin.user_id)?
    {
        Some(()) => Ok(StatusCode::NO_CONTENT),
        None => Err(ApiError::not_found("Order not found")),
    }
}

async fn feed_google(
    State(state): State<AppState>,
    Query(q): Query<ProductQuery>,
) -> Result<Response, ApiError> {
    let locale = q.lang.clone().unwrap_or_else(|| "pt".into());
    let currency = if q
        .country
        .as_deref()
        .map(|c| c.eq_ignore_ascii_case("BR"))
        .unwrap_or(false)
    {
        "BRL"
    } else {
        "USD"
    };
    let products = state.store.list_active_products()?;
    let views: Vec<_> = products
        .iter()
        .map(|p| to_product_view(p, currency, &locale))
        .collect();
    let site = site_url(&state, None);
    let body = build_google_shopping_xml(&views, &site, &locale);
    Ok((
        [(header::CONTENT_TYPE, "application/rss+xml; charset=utf-8")],
        body,
    )
        .into_response())
}

async fn feed_tsv(
    State(state): State<AppState>,
    Query(q): Query<ProductQuery>,
) -> Result<Response, ApiError> {
    let locale = q.lang.clone().unwrap_or_else(|| "pt".into());
    let currency = if q
        .country
        .as_deref()
        .map(|c| c.eq_ignore_ascii_case("BR"))
        .unwrap_or(false)
    {
        "BRL"
    } else {
        "USD"
    };
    let products = state.store.list_active_products()?;
    let views: Vec<_> = products
        .iter()
        .map(|p| to_product_view(p, currency, &locale))
        .collect();
    let site = site_url(&state, None);
    let body = build_products_tsv(&views, &site, &locale);
    Ok((
        [(
            header::CONTENT_TYPE,
            "text/tab-separated-values; charset=utf-8",
        )],
        body,
    )
        .into_response())
}

async fn feed_csv(
    State(state): State<AppState>,
    Query(q): Query<ProductQuery>,
) -> Result<Response, ApiError> {
    let locale = q.lang.clone().unwrap_or_else(|| "pt".into());
    let currency = if q
        .country
        .as_deref()
        .map(|c| c.eq_ignore_ascii_case("BR"))
        .unwrap_or(false)
    {
        "BRL"
    } else {
        "USD"
    };
    let products = state.store.list_active_products()?;
    let views: Vec<_> = products
        .iter()
        .map(|p| to_product_view(p, currency, &locale))
        .collect();
    let site = site_url(&state, None);
    let body = build_meta_catalog_csv(&views, &site, &locale);
    Ok((
        [(header::CONTENT_TYPE, "text/csv; charset=utf-8")],
        body,
    )
        .into_response())
}

async fn sitemap(State(state): State<AppState>) -> Result<Response, ApiError> {
    let products = state.store.list_active_products()?;
    let views: Vec<_> = products
        .iter()
        .map(|p| to_product_view(p, "USD", "en"))
        .collect();
    let site = site_url(&state, None);
    let body = build_sitemap_xml(&views, &site);
    Ok((
        [
            (header::CONTENT_TYPE, "application/xml; charset=utf-8"),
            (header::CACHE_CONTROL, "public, max-age=3600"),
        ],
        body,
    )
        .into_response())
}

fn site_url(state: &AppState, _headers: Option<&HeaderMap>) -> String {
    state
        .public_site_url
        .clone()
        .unwrap_or_else(|| "https://arateki.com".into())
        .trim_end_matches('/')
        .to_string()
}

fn require_admin(state: &AppState, headers: &HeaderMap) -> Result<crate::auth::AdminAuth, ApiError> {
    let auth = headers
        .get(header::AUTHORIZATION)
        .and_then(|v| v.to_str().ok());
    match authenticate_admin(&state.store, &state.jwt, auth) {
        Ok(a) => Ok(a),
        Err(AuthError::Unauthorized) => Err(ApiError::unauthorized_msg("Invalid or missing token")),
        Err(AuthError::Forbidden) => Err(ApiError::forbidden("Admin role required")),
        Err(AuthError::Internal) => Err(ApiError::internal()),
    }
}

pub struct ApiError {
    status: StatusCode,
    body: serde_json::Value,
}

impl ApiError {
    fn bad_request(msg: &str) -> Self {
        Self {
            status: StatusCode::BAD_REQUEST,
            body: json!({ "message": msg }),
        }
    }
    fn unauthorized() -> Self {
        Self {
            status: StatusCode::UNAUTHORIZED,
            body: json!({ "message": "Invalid or missing token" }),
        }
    }
    fn unauthorized_msg(msg: &str) -> Self {
        Self {
            status: StatusCode::UNAUTHORIZED,
            body: json!({ "message": msg }),
        }
    }
    fn forbidden(msg: &str) -> Self {
        Self {
            status: StatusCode::FORBIDDEN,
            body: json!({ "message": msg }),
        }
    }
    fn not_found(msg: &str) -> Self {
        Self {
            status: StatusCode::NOT_FOUND,
            body: json!({ "message": msg }),
        }
    }
    fn internal() -> Self {
        Self {
            status: StatusCode::INTERNAL_SERVER_ERROR,
            body: json!({ "message": "Internal server error" }),
        }
    }
    fn order_fail(code: &str, details: serde_json::Value) -> Self {
        Self {
            status: StatusCode::BAD_REQUEST,
            body: json!({ "message": code, "details": details }),
        }
    }
}

impl From<anyhow::Error> for ApiError {
    fn from(err: anyhow::Error) -> Self {
        tracing::error!(?err, "api error");
        Self::internal()
    }
}

impl From<serde_json::Error> for ApiError {
    fn from(err: serde_json::Error) -> Self {
        tracing::error!(?err, "json error");
        Self::internal()
    }
}

impl IntoResponse for ApiError {
    fn into_response(self) -> Response {
        (self.status, Json(self.body)).into_response()
    }
}

/// Build a fully configured app for tests or production.
pub fn build_app(
    sqlite_path: &str,
    jwt_secret: &str,
    jwt_expires_secs: i64,
    public_site_url: Option<String>,
    admin_login: &str,
    admin_password: &str,
) -> anyhow::Result<(Router, AppState)> {
    let store = Arc::new(Store::open(sqlite_path)?);
    store.seed_if_empty(&crate::seed::default_products())?;
    let admin = store.ensure_admin(admin_login, admin_password)?;
    store.purge_expired_tokens()?;
    let state = AppState {
        store,
        jwt: JwtKeys::new(jwt_secret, jwt_expires_secs),
        public_site_url,
        admin_user_id: admin.id,
    };
    let router = app_router(state.clone());
    Ok((router, state))
}
