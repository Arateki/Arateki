# Arateki

<p align="center">
  <img src="./apps/web/public/03_arateki_black.svg" alt="Arateki Logo" width="200" />
</p>

<p align="center">
  <a href="./README.md">🇧🇷 PT</a> | <a href="./README.en.md">🇺🇸 EN</a> | <a href="./README.es.md">🇪🇸 ES</a> | <a href="./README.ja.md">🇯🇵 JA</a> | <b>🇨🇳 ZH</b>
</p>

---

该代码库包含 **Arateki 落地页**，这是公司的主要入口点。其主要目的是展示我们的愿景并集中信息，包括我们初始产品的潜在客户捕获系统。

Arateki 是一家致力于开发**开源**、**注重隐私**且**符合伦理**的解决方案的技术公司。我们相信维修权以及对个人数据和基础设施的绝对控制。

## 🚀 提到的关键项目

- **SafraSense aqua**: 一款智能、太阳能供电、自主的自研水培传感器，用于监测 EC、pH 和温度等关键指标。
- **Raiznet**: 一个去中心化的生态系统，供当地生产者安全地共享知识和传感器数据。

## 🛠 前端技术栈

以下技术专门用于构建此 Web 应用程序：

- **Frontend**: [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Build Tool**: [Vite 8](https://vitejs.dev/)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/)
- **Testing**: [Vitest](https://vitest.dev/) (单元测试) & [Playwright](https://playwright.dev/) (端到端测试 & 视觉回归测试)
- **Quality**: [ESLint](https://eslint.org/) & [Husky](https://typicode.github.io/husky/) (Git Hooks)

## 📦 入门指南

### 先决条件
- Node.js (推荐最新的 LTS 版本)
- pnpm

### 安装
```bash
# 克隆代码库
git clone https://github.com/Arateki/arateki-landing.git

# 安装依赖项
pnpm install

# 设置环境变量
cp apps/web/.env.example apps/web/.env # 确保已设置 VITE_GOOGLE_SCRIPT_URL
```

### 运行开发服务器
```bash
pnpm dev
```

## 🧪 测试与质量

我们遵循高标准的工程规范以确保可靠性。

- **单元测试**: `pnpm test`
- **端到端测试 & 视觉回归测试**: `pnpm test:e2e`
- **覆盖率报告**: `pnpm test:coverage`
- **运行所有测试**: `pnpm test:all`

**Pre-commit Hook**: Husky 已配置为在每次提交前自动运行 Lint 和单元测试，以防止损坏的代码进入代码库。

## 🛡 许可证

本项目根据 [MIT 许可证](./LICENSE)进行许可。

---
<p align="center">Built by Arateki</p>
