# Arateki API

TypeScript Fastify API for Arateki. Persistence is **SQLite** via Node's built-in `node:sqlite` (Node ≥ 22.5 / recommended 24+).

## Development

```bash
cp .env.example .env   # from apps/api/
pnpm --filter @arateki/api dev
```

No separate database process is required. Default `SQLITE_PATH` in test is `:memory:`; outside test the default is `/var/lib/arateki/arateki.db` (override with env).

On startup, the API creates the first admin when none exists, using `ADMIN_LOGIN` and `ADMIN_PASSWORD`. Only the password hash is stored. After an admin exists, those bootstrap variables are no longer required for startup.

Optional Docker (single service + volume for the `.db`):

```bash
docker compose up -d api
```

## Routes

All API routes are served under `/api` (matches production reverse proxy and `VITE_API_URL`).

- `GET /api/health` — public health check
- `GET /api/products` — public listing (`?country=BR` → BRL; otherwise USD; `?lang=pt|en|es|zh|ja`)
- `POST /api/login` — admin login → `{ token }`
- `GET /api/me`, `POST /api/refresh`, `POST /api/logout`, `PATCH /api/users/password` — auth lifecycle
- `POST /api/products`, `PUT /api/products/:id`, `GET /api/admin/products`… — admin catalog
- `POST /api/orders` — public order create; admin list/get/status
- Feeds: `/api/feeds/google-shopping.xml`, `products.tsv`, `meta-catalog.csv`, `/api/sitemap.xml`

JWTs include `sub`, `role`, `tokenVersion`, `jti`, and `exp`. Logout revokes `jti`. Password changes bump `tokenVersion`.

## Tests

```bash
pnpm --filter @arateki/api test
```

Integration tests use Fastify `app.inject()` with SQLite `:memory:` (no external DB).

## Deploy

Bare-metal (systemd) and t3.nano SSH-push: `../../deploy/README.md`.
Rust rewrite plan: `../../docs/RUST-MIGRATION-SPEC.md`.
