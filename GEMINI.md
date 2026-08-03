# Arateki - AI Development Guidelines

This document serves as a foundational mandate for AI agents working on the Arateki Landing Page project.

## Current state (2026-08)

- pnpm monorepo: `apps/web` (React/Vite) + `apps/api` (Fastify + **SQLite** via `node:sqlite`).
- MongoDB has been **removed**. Do not reintroduce `mongodb` or `mongodb-memory-server`.
- Deploy: home-server Docker (optional, SQLite volume) + bare-metal/t3.nano via `deploy/` and CI SSH-push (`docs/SQLITE-BAREMETAL-SPEC.md`).
- Optional next rewrite: Rust API (`docs/RUST-MIGRATION-SPEC.md`, crate `apps/api-rs`).

### API stack to know

- Domain: `apps/api/src/domain/*`
- Application: `apps/api/src/application/*`
- SQLite infrastructure: `apps/api/src/infrastructure/sqlite/*`
- Password: scrypt + salt (`salt:hexhash`) in `infrastructure/password-hasher.ts`
- HTTP: `apps/api/src/http/*` (prefix `/api`)
- Tests: `apps/api/src/http/routes.test.ts` (contract), unit tests colocated; SQLite `:memory:` via `test/test-app.ts`

### Validated commands

```bash
pnpm --filter @arateki/api test
pnpm --filter @arateki/api build
pnpm --filter @arateki/web test
```

### Product / order contract (summary)

- Products: localized `name`/`description` (`pt|en|es|zh|ja`), variant prices `{ brlCents, usdCents }`.
- `GET /products?country=BR` → BRL; other country → USD. `lang` selects copy.
- Orders: public create as `pending`; currency from `address.country`; stock decremented transactionally.

## Project overview

- **Type**: Landing page, catalog, checkout leads.
- **Mission**: Open-source, privacy-focused, ethically built solutions.
- **Key products**: SafraSense, Raiznet.
