# Arateki - AI Development Guidelines

## Current state (2026-08)

- pnpm monorepo: `apps/web` (React/Vite).
- API: **`apps/api-rs`** only (Rust + SQLite, axum). The former Node/Fastify API (`apps/api`) was removed; recover from git history if needed.
- Production: static musl binary + systemd (`deploy/`). CI builds on GitHub and deploys home + T3.

### Commands

```bash
pnpm --filter @arateki/web test
pnpm --filter @arateki/web build
cargo test --manifest-path apps/api-rs/Cargo.toml
cargo run --manifest-path apps/api-rs/Cargo.toml
```

### Contract tests

`apps/api-rs/tests/routes.rs` — parity with the old Node `routes.test.ts` scenarios.

## Project overview

- Landing, catalog, checkout leads.
- Open-source, privacy-focused products (SafraSense, Raiznet).
