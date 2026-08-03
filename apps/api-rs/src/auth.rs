use crate::db::Store;
use chrono::{Duration, Utc};
use jsonwebtoken::{decode, encode, DecodingKey, EncodingKey, Header, Validation};
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Claims {
    pub sub: String,
    pub role: String,
    pub token_version: i64,
    pub jti: String,
    pub exp: i64,
    pub iat: i64,
}

#[derive(Clone)]
pub struct JwtKeys {
    pub encoding: EncodingKey,
    pub decoding: DecodingKey,
    pub expires_secs: i64,
}

impl JwtKeys {
    pub fn new(secret: &str, expires_secs: i64) -> Self {
        Self {
            encoding: EncodingKey::from_secret(secret.as_bytes()),
            decoding: DecodingKey::from_secret(secret.as_bytes()),
            expires_secs,
        }
    }

    pub fn sign_admin(&self, user_id: &str, token_version: i64) -> anyhow::Result<String> {
        let now = Utc::now();
        let claims = Claims {
            sub: user_id.to_string(),
            role: "admin".into(),
            token_version,
            jti: Uuid::new_v4().to_string(),
            iat: now.timestamp(),
            exp: (now + Duration::seconds(self.expires_secs)).timestamp(),
        };
        Ok(encode(&Header::default(), &claims, &self.encoding)?)
    }

    pub fn sign_with_claims(&self, claims: &Claims) -> anyhow::Result<String> {
        Ok(encode(&Header::default(), claims, &self.encoding)?)
    }

    pub fn decode(&self, token: &str) -> anyhow::Result<Claims> {
        let data = decode::<Claims>(token, &self.decoding, &Validation::default())?;
        Ok(data.claims)
    }
}

pub struct AdminAuth {
    pub user_id: String,
    pub token_version: i64,
    pub jti: String,
    pub exp: i64,
}

pub fn authenticate_admin(
    store: &Arc<Store>,
    keys: &JwtKeys,
    auth_header: Option<&str>,
) -> Result<AdminAuth, AuthError> {
    let token = auth_header
        .and_then(|h| h.strip_prefix("Bearer "))
        .ok_or(AuthError::Unauthorized)?;
    let claims = keys.decode(token).map_err(|_| AuthError::Unauthorized)?;
    if claims.role != "admin" || claims.sub.is_empty() || claims.jti.is_empty() {
        return Err(AuthError::Unauthorized);
    }
    if store
        .is_revoked(&claims.jti)
        .map_err(|_| AuthError::Internal)?
    {
        return Err(AuthError::Unauthorized);
    }
    let user = store
        .find_user_by_id(&claims.sub)
        .map_err(|_| AuthError::Internal)?
        .ok_or(AuthError::Unauthorized)?;
    // Stale tokenVersion (e.g. after password change) → 401, matching routes.test.ts
    if user.token_version != claims.token_version {
        return Err(AuthError::Unauthorized);
    }
    if user.role != "admin" {
        return Err(AuthError::Forbidden);
    }
    Ok(AdminAuth {
        user_id: claims.sub,
        token_version: claims.token_version,
        jti: claims.jti,
        exp: claims.exp,
    })
}

#[derive(Debug)]
pub enum AuthError {
    Unauthorized,
    Forbidden,
    Internal,
}
