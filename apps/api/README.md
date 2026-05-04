# Arateki API

TypeScript Fastify API for Arateki.

## Development

```bash
docker compose up -d mongodb
pnpm --filter @arateki/api dev
```

The API reads configuration from environment variables. Start from `.env.example` when running outside Docker.

On startup, the API creates the first admin user when no admin exists in MongoDB. It uses `ADMIN_LOGIN` and `ADMIN_PASSWORD`, stores only a password hash, and never writes the plaintext password back to disk. After an admin exists, those bootstrap variables are no longer required for startup.

## Routes

All API routes are served under `/api`. This matches the production reverse
proxy and the frontend's default `VITE_API_URL`.

- `GET /api/health`: public health check.
- `GET /api/products`: public product listing. Use `?country=BR` for BRL prices; other country values return USD prices. Use `?lang=pt|en|es|zh|ja` for localized product copy.
- `POST /api/login`: public admin login with `{ "login": "...", "password": "..." }`. Returns a JWT when the credentials match the stored admin.
- `POST /api/logout`: private token revocation for the current JWT.
- `PATCH /api/users/password`: private password change for the current JWT user with `{ "currentPassword": "...", "newPassword": "..." }`.
- `POST /api/products`: private product creation. Requires a JWT signed with `JWT_SECRET` and payload `{ "role": "admin" }`.
- `POST /api/orders`: public order creation. Receives contact, address, and items with `productId`, `variantId`, and `quantity`; the API infers currency, product snapshots, prices, totals, and creates the order as `pending`.

JWTs include `sub` (user id), `role`, `tokenVersion`, `jti`, and `exp`. Logout stores the `jti` in `revokedTokens` until expiration. Password changes increment `users.tokenVersion`, which invalidates previous tokens for that user.

Products are stored with localized `name`/`description` objects and `variants`. Each variant has `sku`, `attributes`, `stock`, `active`, and `prices: { brlCents, usdCents }`. The API response projects the selected `priceCents`, `currency`, `name`, and `description`; product-level `priceCents` is the lowest active variant price and product-level `stock` is the sum of active variant stock.

Orders are stored with immutable item snapshots for the selected variant. The client cannot submit status, unit price, subtotal, total, currency, SKU, or product name; those values are inferred from the current product data during order creation.

## Tests

```bash
pnpm --filter @arateki/api test
```

Integrated tests use Fastify's `app.inject()` plus `mongodb-memory-server`; they do not require the Docker MongoDB service.
