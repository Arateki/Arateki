# Arateki

<p align="center">
  <img src="./apps/web/public/03_arateki_black.svg" alt="Arateki Logo" width="200" />
</p>

<p align="center">
  <a href="./README.md">🇧🇷 PT</a> | <a href="./README.en.md">🇺🇸 EN</a> | <a href="./README.es.md">🇪🇸 ES</a> | <b>🇯🇵 JA</b> | <a href="./README.zh.md">🇨🇳 ZH</a>
</p>

---

このリポジトリには、**Arateki ランディングページ**が含まれています。これは当社の主要なエントリーポイントです。主な目的は、当社のビジョンを提示し、初期製品のリード獲得システムを含む情報を一元化することです。

Arateki は、**オープンソース**で**プライバシーを重視**し、**倫理的に構築された**ソリューションの開発に専念するテクノロジー企業です。私たちは修理する権利と、自身のデータおよびインフラストラクチャに対する絶対的なコントロールを信じています。

## 🚀 言及されている主要プロジェクト

- **SafraSense aqua**: EC、pH、温度などの重要な指標を監視する、スマートで太陽光発電式の自律型水耕栽培センサー。
- **Raiznet**: 地元の生産者が知識やセンサーデータを安全に共有するための分散型エコシステム。

## 🛠 フロントエンド技術スタック

このウェブアプリケーションの構築には、以下の技術が独占的に使用されています：

- **フロントエンド**: [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **ビルドツール**: [Vite 8](https://vitejs.dev/)
- **スタイリング**: [Tailwind CSS 4](https://tailwindcss.com/)
- **テスト**: [Vitest](https://vitest.dev/) (ユニット) & [Playwright](https://playwright.dev/) (E2E & ビジュアルリグレッション)
- **品質**: [ESLint](https://eslint.org/) & [Husky](https://typicode.github.io/husky/) (Git フック)

## 📦 はじめに

### 前提条件
- Node.js (最新の LTS 推奨)
- pnpm

### インストール
```bash
# リポジトリをクローン
git clone https://github.com/Arateki/arateki-landing.git

# 依存関係をインストール
pnpm install

# 環境変数の設定
cp apps/web/.env.example apps/web/.env # VITE_GOOGLE_SCRIPT_URL が設定されていることを確認してください
```

### 開発サーバーの起動
```bash
pnpm dev
```

## 🧪 テストと品質 Japan

当社は信頼性を確保するために高いエンジニアリング基準に従っています。

- **ユニットテスト**: `pnpm test`
- **E2E & ビジュアルリグレッション**: `pnpm test:e2e`
- **カバレッジレポート**: `pnpm test:coverage`
- **すべて実行**: `pnpm test:all`

**Pre-commit Hook**: Husky は、壊れたコードがリポジトリに届かないように、コミット前に Lint とユニットテストを自動的に実行するように設定されています。

## 🛡 ライセンス

このプロジェクトは [MIT ライセンス](./LICENSE) の下でライセンスされています。

---
<p align="center">Built by Arateki</p>
