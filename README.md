# Arateki

<p align="center">
  <img src="./apps/web/public/03_arateki_black.svg" alt="Arateki Logo" width="200" />
</p>

<p align="center">
  <a href="./README.pt-br.md">🇧🇷 PT</a> | <b>🇺🇸 EN</b> | <a href="./README.es.md">🇪🇸 ES</a> | <a href="./README.ja.md">🇯🇵 JA</a> | <a href="./README.zh.md">🇨🇳 ZH</a>
</p>

---

This repository contains the **Arateki Landing Page**, the primary entry point for the company. Its main purpose is to present our vision and centralize information, including the lead capture system for our initial products.

Arateki is a technology company dedicated to developing **open-source**, **privacy-focused**, and **ethically built** solutions. We believe in the right to repair and absolute control over your own data and infrastructure.

## 🚀 Key Projects Mentioned

- **SafraSense aqua**: A smart, solar-powered, autonomous sensor for hydroponic crops monitoring vital metrics like EC, pH, and temperature.
- **Raiznet**: A decentralized ecosystem for local producers to share knowledge and sensor data securely.

## 🛠 Frontend Tech Stack

The following technologies were used exclusively to build this web application:

- **Frontend**: [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Build Tool**: [Vite 8](https://vitejs.dev/)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/)
- **Testing**: [Vitest](https://vitest.dev/) (Unit) & [Playwright](https://playwright.dev/) (E2E & Visual Regression)
- **Quality**: [ESLint](https://eslint.org/) & [Husky](https://typicode.github.io/husky/) (Git Hooks)

## 📁 Repository Layout

- `apps/web`: current React/Vite frontend.
- `apps/api`: Fastify API with JWT authentication and MongoDB persistence.

## 📦 Getting Started

### Prerequisites
- Node.js (Latest LTS recommended)
- pnpm

### Installation
```bash
# Clone the repository
git clone https://github.com/Arateki/arateki-landing.git

# Install dependencies
pnpm install

# Setup environment variables
cp apps/web/.env.example apps/web/.env # Ensure VITE_GOOGLE_SCRIPT_URL is set
```

### Running Development Server
```bash
pnpm dev
```

### Running API Server
```bash
docker compose up -d mongodb
pnpm dev:api
```

## 🧪 Testing & Quality

We follow high engineering standards to ensure reliability.

- **Unit Tests**: `pnpm test`
- **E2E & Visual Regression**: `pnpm test:e2e`
- **Coverage Report**: `pnpm test:coverage`
- **Run All**: `pnpm test:all`

**Pre-commit Hook**: Husky is configured to automatically run Lint and Unit Tests before every commit to prevent broken code from reaching the repository.

## 🛡 License

This project is licensed under the [MIT License](./LICENSE).

---
<p align="center">Built by Arateki</p>
