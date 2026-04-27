# Arateki — Claude Development Guide

Reference document for Claude (and other AI agents) working on this codebase. Read before touching any file.

---

## Project Overview

**Type:** Landing page + e-commerce (components store) + lead capture.
**Mission:** Open-source, privacy-focused hardware solutions.
**Products:** SafraSense (hydroponic IoT sensor) and Raiznet (decentralized producer network).
**Routes:**
- `/` — Landing page (Hero, SafraSense, Raiznet, Manifesto, Waitlist, FAQ, Footer)
- `/vendas` — Components store (product grid + cart drawer + product modal)
- `/checkout` — Multi-step checkout (Contact → Delivery → Payment → Confirmation)

---

## Tech Stack

| Layer | Tool | Version |
|---|---|---|
| UI | React | 19 |
| Language | TypeScript | ~6.0 (strict, no `any`) |
| Styling | Tailwind CSS | 4 (inline classes, no config file) |
| Build | Vite | 8 |
| Router | React Router DOM | 7 |
| Icons | Lucide React | 0.470 |
| Unit tests | Vitest + Testing Library | 3 |
| E2E tests | Playwright | 1.50 |
| Git hooks | Husky | 9 (blocks commit if lint/tests fail) |

---

## Directory Structure

```
src/
├── assets/fonts/          # Montserrat local fonts (Light, Regular, Medium, Bold, BoldItalic)
├── components/
│   ├── checkout/          # CheckoutInput, CheckoutStepper, OrderSummary
│   │   └── steps/         # ContactStep, DeliveryStep, PaymentStep, ConfirmationStep
│   ├── common/            # FadeInSection, Logos, ParticleBackground
│   ├── layout/            # Navbar, Footer
│   ├── sales/             # ProductCard, ProductModal, CartDrawer
│   └── sections/          # Hero, SafraSense, Raiznet, Manifesto, Waitlist, FAQ
├── context/
│   └── CartContext.tsx     # Global cart state (CartProvider + useCart hook)
├── hooks/
│   ├── useAppConfig.ts     # Theme (dark/light) + language — the single source of truth for UI config
│   └── useProducts.ts      # Fetches product list from productService
├── i18n/
│   └── translations.tsx    # ALL UI strings for 5 languages — always update all 5
├── pages/
│   ├── Home.tsx
│   ├── Sales.tsx
│   └── Checkout.tsx
├── services/
│   ├── checkoutService.ts  # Mock POST /orders — replace URL when real API is ready
│   ├── emailService.ts     # Waitlist email submission
│   └── productService.ts   # Mock product list — replace with real API
├── types/
│   ├── checkout.ts         # CheckoutFormData, DeliveryData, ShippingOption, SHIPPING_OPTIONS
│   ├── global.d.ts         # Browser API ambient types
│   ├── i18n.ts             # TranslationType — must mirror translations.tsx exactly
│   └── product.ts          # Product interface
└── index.css               # @font-face declarations + animate-fadeIn / animate-scaleIn keyframes
```

---

## Architecture Rules

### Single Responsibility
- **Pages** (`src/pages/`): layout only — compose components, wire state.
- **Components** (`src/components/`): purely declarative, receive props.
- **Hooks** (`src/hooks/`): all logic and side effects.
- **Services** (`src/services/`): all API/network calls. Never call `fetch` inside a component.

### State Management
- **Theme + Language:** `useAppConfig()` — reads/writes localStorage, exposes `{ theme, toggleTheme, lang, setLang, t }`. Every page calls this hook independently; they share state only via localStorage.
- **Cart:** `CartContext` (React Context) — wrapped at `App.tsx` level, available in all routes. Use `useCart()` inside any component.
- **Checkout form:** local `useState` inside `Checkout.tsx`, passed down as props to each step.

### Internationalisation
- All visible strings MUST come from `t` (from `useAppConfig`) or `tCo` (the `t.checkout` subset).
- **Never hardcode UI text** in components — add it to `translations.tsx` and `i18n.ts` first.
- Supported languages: `pt | en | es | zh | ja`. All five must be updated simultaneously.
- Checkout steps receive `tCo: TranslationType['checkout']` as a prop and use `tCo.contact.*`, `tCo.delivery.*`, etc.
- `TranslationType` in `src/types/i18n.ts` must be kept in sync with `translations.tsx`.

---

## Design System

### Color Palette (non-obvious — do not use pure black/white)

| Token | Dark mode | Light mode |
|---|---|---|
| Page background | `bg-[#111111]` | `bg-[#F5F5F5]` |
| Card / surface | `bg-[#1C1C1C]` | `bg-white` |
| Drawer / modal bg | `bg-[#161616]` | `bg-white` |
| Sidebar (OrderSummary) | `bg-[#1A1A1A]` | `bg-white` |
| Navbar bg | `bg-[#111111]/90` | `bg-[#F5F5F5]/90` |
| Primary text | `text-[#E8E8E8]` | `text-[#1A1A1A]` |
| Primary button | `bg-[#E0E0E0] text-[#181818]` | `bg-[#1D1D1D] text-[#F0F0F0]` |
| Primary button hover | `hover:bg-[#CACACA]` | `hover:bg-[#2E2E2E]` |
| Badge (cart count) | `bg-[#E0E0E0] text-[#181818]` | `bg-[#1D1D1D] text-[#F0F0F0]` |
| Borders | `border-[#2A2A2A]` | `border-[#E0E0E0]` |
| Selection | `selection:bg-[#E0E0E0] selection:text-[#181818]` | `selection:bg-[#1D1D1D] selection:text-[#F0F0F0]` |

### Typography
- Font: Montserrat (local, `src/assets/fonts/`). Declared with `@font-face` in `index.css`.
- Small labels (`text-[10px] uppercase tracking-widest`): use `font-semibold opacity-70+` — never `font-light opacity-50` (illegible).
- Secondary body text: `font-medium opacity-80+` — never `font-light opacity-50`.
- Placeholders: `/40` opacity minimum (e.g. `placeholder:text-[#E8E8E8]/40`).

### Modals & Overlays
- Backdrop: `bg-black/50 backdrop-blur-sm` — not pure black.
- Animation: `animate-fadeIn` (backdrop) + `animate-scaleIn` (panel) — keyframes defined in `index.css`.
- Z-index convention: Navbar `z-50`, Checkout header `z-40`, CartDrawer `z-50`, ProductModal `z-50`, custom dropdown backdrop `z-40` panel `z-50`.

---

## Key Patterns

### Adding a new translatable string
1. Add the key to `TranslationType` in `src/types/i18n.ts`.
2. Add the string for all 5 languages in `src/i18n/translations.tsx`.
3. Use it via `t.yourKey` (from `useAppConfig`) or `tCo.yourKey` (in checkout steps).

### Adding a new product field
1. Update `Product` in `src/types/product.ts`.
2. Update mock data in `src/services/productService.ts`.
3. Update `ProductCard` and/or `ProductModal` to display it.

### Native `<select>` elements — avoid for dropdowns
Browser-rendered `<select>` popups ignore CSS — background color and text color of the options list cannot be themed. Use custom div-based dropdowns instead (see the lang switcher in `Checkout.tsx` as the reference implementation).

### CEP lookup (Brazil postal code)
`DeliveryStep.tsx` auto-fills street/neighborhood/city/state by calling `https://viacep.com.br/ws/{cep}/json/` when CEP reaches 8 digits. No API key needed.

### Checkout mock → real API
`src/services/checkoutService.ts` has `createOrder(payload)` returning a fake order ID after 1.8s. When the real API is ready, replace the `setTimeout` block with `fetch('/api/orders', { method: 'POST', body: JSON.stringify(payload) })`. The payload shape (`OrderPayload`) is already correct.

### Cart drawer vs checkout navigation
- `CartDrawer` has a `Link to="/checkout"` that also calls `closeCart()`.
- `Checkout.tsx` redirects to `/vendas` via `useEffect` if the cart is empty and no `orderId` exists (prevents empty checkout access).
- After a successful order, `clearCart()` is called and `orderId` is set, which prevents the redirect.

---

## Workflow

```bash
npm run dev          # Dev server
npm run build        # TypeScript check + Vite build (run before finishing any task)
npm test             # Vitest unit tests
npm run test:e2e     # Playwright E2E
npm run test:all     # Both
```

**Always run `npm run build` before reporting a task as done.** Husky blocks commits on lint/test failure.

---

## What NOT to do

- Do not use `any` — use proper types or `unknown`.
- Do not hardcode UI strings — add to translations first.
- Do not call `fetch` directly in components — use a service.
- Do not use pure `#000000` / `#FFFFFF` for backgrounds or primary buttons — use the palette above.
- Do not use `font-light` + `opacity-50` for labels — use `font-medium/semibold` + `opacity-70+`.
- Do not use native `<select>` for themed dropdowns.
- Do not commit `.env` files (Husky won't catch this automatically).

---

*Keep this file updated as the project evolves.*
