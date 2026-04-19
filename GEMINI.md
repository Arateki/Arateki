# Arateki - AI Development Guidelines

This document serves as a foundational mandate for AI agents (Gemini) working on the Arateki Landing Page project. Follow these standards strictly to maintain consistency and professional quality.

## 🎯 Project Overview
- **Type**: Landing Page & Lead Capture.
- **Mission**: Open-source, privacy-focused, and ethically built solutions.
- **Key Products**: SafraSense (Hydroponic Sensor) and Raiznet (Decentralized Network).

## 🏛 Architecture & SOLID Patterns
- **SRP (Single Responsibility Principle)**: 
  - Keep components purely declarative.
  - Logic MUST be extracted to custom hooks (`src/hooks/`).
  - Infrastructure/API calls MUST be isolated in services (`src/services/`).
- **State Management**: Local React state with hooks. Configuration (theme/lang) is managed by `useAppConfig.ts`.

## 🛠 Tech Stack Standards
- **Frontend**: React 19 + TypeScript (Strict Mode).
- **Styling**: Tailwind CSS 4 (Theme variables in `index.css`).
- **Build**: Vite 6.
- **Internationalization**: Managed via `src/i18n/translations.tsx`. Supported: PT, EN, ES, JA, ZH.

## 🧪 Testing Strategy (Mandatory)
Any feature or refactoring must be validated by:
1. **Unit Tests (Vitest)**: For hooks and pure logic. Files: `src/**/*.test.ts`.
2. **E2E & Visual Regression (Playwright)**: For user journeys and layout integrity. Files: `tests/e2e/*.spec.ts`.
   - **Visual Snapshot**: Use `mask` or `visibility: hidden` for dynamic elements (like canvas particles) during snapshots.
- **Coverage**: Maintain high coverage for core logic (hooks/translations).

## 📋 Coding Standards
- **Strict Typing**: NEVER use `any`. Use global types in `src/types/global.d.ts` for browser APIs.
- **Environment Variables**: Use `import.meta.env.VITE_*`. Never hardcode URLs.
- **Assets**: 
  - Logos are managed via `src/components/common/Logos.tsx` using `<img>` tags pointing to `public/`.
  - Fonts MUST be local (`src/assets/fonts/`) using `@font-face` in `index.css`.
- **Git Safety**: 
  - Husky is active. Commits will fail if Lint or Vitest fail.
  - Ensure `.env` is never committed.

## 🚀 Workflow for Evolution
1. **Research**: Read `useAppConfig` and `translations.tsx` before changing UI.
2. **Implementation**: Follow the established directory structure.
3. **Verification**: 
   - Run `npm test` for logic.
   - Run `npm run test:e2e` for UI.
   - Ensure `npm run build` passes before finishing.

---
*This document is the source of truth for the project's engineering culture.*
