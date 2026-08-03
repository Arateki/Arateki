//! scrypt password hashing compatible with Node `crypto.scrypt` defaults
//! (N=16384, r=8, p=1) and format `saltHex:derivedHex` where salt is the
//! UTF-8 bytes of the hex string (same as Node `scrypt(password, saltString, …)`).

use rand::RngCore;
use scrypt::{scrypt, Params};
use subtle::ConstantTimeEq;

const KEY_LEN: usize = 64;

fn params() -> Params {
    // Node defaults: N=16384, r=8, p=1
    Params::new(14, 8, 1, KEY_LEN).expect("scrypt params")
}

pub fn hash_password(password: &str) -> String {
    let mut salt_bytes = [0u8; 16];
    rand::thread_rng().fill_bytes(&mut salt_bytes);
    let salt = hex::encode(salt_bytes);
    let mut key = vec![0u8; KEY_LEN];
    scrypt(password.as_bytes(), salt.as_bytes(), &params(), &mut key).expect("scrypt");
    format!("{salt}:{}", hex::encode(key))
}

pub fn verify_password(password: &str, stored: &str) -> bool {
    let Some((salt, hash_hex)) = stored.split_once(':') else {
        return false;
    };
    let Ok(expected) = hex::decode(hash_hex) else {
        return false;
    };
    let mut key = vec![0u8; expected.len()];
    if scrypt(password.as_bytes(), salt.as_bytes(), &params(), &mut key).is_err() {
        return false;
    }
    bool::from(key.as_slice().ct_eq(expected.as_slice()))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn roundtrip() {
        let h = hash_password("admin-password");
        assert!(verify_password("admin-password", &h));
        assert!(!verify_password("wrong", &h));
    }
}
