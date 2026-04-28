# Arateki - AI Development Guidelines

This document serves as a foundational mandate for AI agents (Gemini) working on the Arateki Landing Page project. Follow these standards strictly to maintain consistency and professional quality.

## Current Handoff - 2026-04-27

The repository is mid-refactor into a pnpm monorepo with `apps/web` and `apps/api`. The current work is intentionally not committed yet.

### What Was Done
- Monorepo scripts were wired from the root: `pnpm build`, `pnpm lint`, `pnpm test`, and `pnpm dev:api`.
- Frontend routes were normalized to English; the store route is `/sales`, not `/vendas`.
- The language dropdown from checkout was reused as the standard visual pattern for themed dropdowns. Avoid native `<select>` for styled language selectors.
- A TypeScript Fastify API was created under `apps/api` with MongoDB, JWT auth, Vitest tests, and `mongodb-memory-server` for integrated tests.
- Docker MongoDB support was added through root `docker-compose.yml`.
- Auth implemented:
  - `POST /login` with `{ login, password }`.
  - JWT payload includes `sub`, `role`, `tokenVersion`, `jti`, and `exp`.
  - Current role model is only `admin`.
  - `POST /logout` revokes the current JWT by `jti`.
  - `PATCH /users/password` changes the current token user's password using `sub` from the JWT and increments `tokenVersion`.
  - First admin bootstrap uses `ADMIN_LOGIN` and `ADMIN_PASSWORD` only when no admin exists in MongoDB.
  - Passwords are hashed with scrypt + salt; plaintext is never written back to disk.
- Products implemented:
  - Public `GET /products`.
  - Admin `POST /products`.
  - Products use localized `name` and `description` objects for `pt`, `en`, `es`, `zh`, `ja`.
  - Prices are variant-level with `{ brlCents, usdCents }`.
  - `GET /products?country=BR` returns BRL; any other country returns USD.
  - `GET /products?lang=pt|en|es|zh|ja` projects localized copy.
  - Products always have at least one variant. A simple product should have one default variant; the frontend can hide variant selection when `variants.length === 1`.
  - Variant fields: `id`, `sku`, `attributes`, `prices`, `stock`, `active`.
  - Product response includes product-level `priceCents` as the lowest active variant price and product-level `stock` as the sum of active variant stock.
- Orders implemented:
  - Public `POST /orders`.
  - Receives `contact`, `address`, and `items`.
  - Each item requires `productId`, `variantId`, and `quantity`.
  - Orders are created with `status: "pending"`.
  - The API infers currency from `address.country`, product name, SKU, unit price, subtotal, and total. The client cannot submit price, total, currency, status, SKU, or product name.
  - The route validates minimum fields and returns `400` for invalid payload, missing product/variant, or insufficient stock.
  - Order documents store immutable item snapshots.

### Current API Files To Know
- `apps/api/src/domain/product.ts`
- `apps/api/src/domain/order.ts`
- `apps/api/src/application/create-order.ts`
- `apps/api/src/http/order-routes.ts`
- `apps/api/src/http/product-routes.ts`
- `apps/api/src/http/auth-routes.ts`
- `apps/api/src/http/schemas.ts`
- `apps/api/src/infrastructure/mongo-product-repository.ts`
- `apps/api/src/infrastructure/mongo-order-repository.ts`
- `apps/api/src/test/test-app.ts`
- `apps/api/README.md`

### Validated Commands
- `pnpm build` passed.
- `pnpm lint` passed.
- `pnpm test` passed with API `24/24` and web `5/5`.
- Note: integrated API tests use `mongodb-memory-server`, which needs permission to open a local port. In sandboxed environments, `pnpm test` may fail with `listen EPERM 0.0.0.0`; rerun outside the sandbox.

### What Is Still Pending / Recommended Next
- Implement atomic stock reservation/decrement for `POST /orders`. The current order flow validates stock but does not yet reserve or decrement it, so concurrent orders can oversell. Prefer a Mongo atomic update by `productId + variantId` or a transaction if the model expands.
- Add order management endpoints for admin:
  - list orders
  - get order by id
  - update status after payment/manual review
- Decide the order status lifecycle. Current only status is `pending`; likely future states: `pending`, `paid`, `processing`, `shipped`, `cancelled`.
- Wire frontend checkout to `POST /orders`. `apps/web/src/services/checkoutService.ts` still has a mock flow and should be replaced with the real API call.
- Update frontend product types/services to consume backend variants and i18n product response.
- Consider adding duplicate item merge in order creation if the same `productId + variantId` appears multiple times in one payload.
- Consider checkout security additions before production:
  - stricter rate limit on `POST /orders`
  - server-side email normalization
  - phone/postal-code country-specific validation
  - anti-spam or payment-provider verification when payment is introduced

## 🎯 Project Overview
- **Type**: Landing Page & Lead Capture.
- **Mission**: Open-source, privacy-focused, and ethically built solutions.
- **Key Products**: SafraSense (Hydroponic Sensor) and Raiznet (Decentralized Network).

## 🏛 Architecture & SOLID Patterns
- **SRP (Single Responsibility Principle)**: 
  - Keep components purely declarative.
  - Logic MUST be extracted to custom hooks (`apps/web/src/hooks/`).
  - Infrastructure/API calls MUST be isolated in services (`apps/web/src/services/`).
- **State Management**: Local React state with hooks. Configuration (theme/lang) is managed by `useAppConfig.ts`.

## 🛠 Tech Stack Standards
- **Frontend**: React 19 + TypeScript (Strict Mode).
- **Styling**: Tailwind CSS 4 (Theme variables in `index.css`).
- **Build**: Vite 8.
- **Internationalization**: Managed via `apps/web/src/i18n/translations.tsx`. Supported: PT, EN, ES, JA, ZH.

## 🧪 Testing Strategy (Mandatory)
Any feature or refactoring must be validated by:
1. **Unit Tests (Vitest)**: For hooks and pure logic. Files: `apps/web/src/**/*.test.ts`.
2. **E2E & Visual Regression (Playwright)**: For user journeys and layout integrity. Files: `apps/web/tests/e2e/*.spec.ts`.
   - **Visual Snapshot**: Use `mask` or `visibility: hidden` for dynamic elements (like canvas particles) during snapshots.
- **Coverage**: Maintain high coverage for core logic (hooks/translations).

## 📋 Coding Standards
- **Strict Typing**: NEVER use `any`. Use global types in `apps/web/src/types/global.d.ts` for browser APIs.
- **Environment Variables**: Use `import.meta.env.VITE_*`. Never hardcode URLs.
- **Assets**: 
  - Logos are managed via `apps/web/src/components/common/Logos.tsx` using `<img>` tags pointing to `public/`.
  - Fonts MUST be local (`apps/web/src/assets/fonts/`) using `@font-face` in `index.css`.
- **Git Safety**: 
  - Husky is active. Commits will fail if Lint or Vitest fail.
  - Ensure `.env` is never committed.

## 🚀 Workflow for Evolution
1. **Research**: Read `useAppConfig` and `translations.tsx` before changing UI.
2. **Implementation**: Follow the established directory structure.
3. **Verification**: 
   - Run `pnpm test` for logic.
   - Run `pnpm test:e2e` for UI.
   - Ensure `pnpm build` passes before finishing.

--- 
*This document is the source of truth for the project's engineering culture.*
