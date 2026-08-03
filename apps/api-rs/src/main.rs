use arateki_api::build_app;
use std::env;
use std::net::SocketAddr;
use tracing_subscriber::EnvFilter;

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    tracing_subscriber::fmt()
        .with_env_filter(EnvFilter::from_default_env().add_directive("info".parse()?))
        .init();

    let host = env::var("HOST").unwrap_or_else(|_| "0.0.0.0".into());
    let port: u16 = env::var("PORT")
        .ok()
        .and_then(|p| p.parse().ok())
        .unwrap_or(3333);
    let sqlite_path = env::var("SQLITE_PATH").unwrap_or_else(|_| "/var/lib/arateki/arateki.db".into());
    let jwt_secret = env::var("JWT_SECRET").unwrap_or_else(|_| "dev-secret-change-me".into());
    let jwt_expires = parse_expires(&env::var("JWT_EXPIRES_IN").unwrap_or_else(|_| "12h".into()));
    let public_site_url = env::var("PUBLIC_SITE_URL").ok();
    let admin_login = env::var("ADMIN_LOGIN").unwrap_or_else(|_| "admin".into());
    let admin_password = env::var("ADMIN_PASSWORD").unwrap_or_else(|_| "admin-password".into());

    let (app, _state) = build_app(
        &sqlite_path,
        &jwt_secret,
        jwt_expires,
        public_site_url,
        &admin_login,
        &admin_password,
    )?;

    let addr: SocketAddr = format!("{host}:{port}").parse()?;
    tracing::info!(%addr, %sqlite_path, "arateki-api listening");
    let listener = tokio::net::TcpListener::bind(addr).await?;
    axum::serve(listener, app).await?;
    Ok(())
}

fn parse_expires(s: &str) -> i64 {
    if let Some(h) = s.strip_suffix('h') {
        return h.parse::<i64>().unwrap_or(12) * 3600;
    }
    if let Some(m) = s.strip_suffix('m') {
        return m.parse::<i64>().unwrap_or(60) * 60;
    }
    s.parse().unwrap_or(12 * 3600)
}
