# Arateki

<p align="center">
  <img src="./apps/web/public/03_arateki_black.svg" alt="Arateki Logo" width="200" />
</p>

<p align="center">
  <b>🇧🇷 PT</b> | <a href="./README.md">🇺🇸 EN</a> | <a href="./README.es.md">🇪🇸 ES</a> | <a href="./README.ja.md">🇯🇵 JA</a> | <a href="./README.zh.md">🇨🇳 ZH</a>
</p>

---

Este repositório contém a **Landing Page da Arateki**, o ponto de entrada principal da empresa. Seu objetivo principal é apresentar nossa visão e centralizar informações, incluindo o sistema de captura de leads para nossos produtos iniciais.

A Arateki é uma empresa de tecnologia dedicada ao desenvolvimento de soluções **open-source**, focadas em **privacidade** e construídas de forma **ética**. Acreditamos no direito ao reparo e no controle absoluto sobre seus próprios dados e infraestrutura.

## 🚀 Projetos Principais Mencionados

- **SafraSense aqua**: Um sensor inteligente, movido a energia solar e autônomo para cultivos hidropônicos, monitorando métricas vitais como EC, pH e temperatura.
- **Raiznet**: Um ecossistema descentralizado para que produtores locais compartilhem conhecimento e dados de sensores de forma segura.

## 🛠 Stack Tecnológica Frontend

As seguintes tecnologias foram utilizadas exclusivamente para a construção desta aplicação web:

- **Frontend**: [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Ferramenta de Build**: [Vite 8](https://vitejs.dev/)
- **Estilização**: [Tailwind CSS 4](https://tailwindcss.com/)
- **Testes**: [Vitest](https://vitest.dev/) (Unidade) & [Playwright](https://playwright.dev/) (E2E & Regressão Visual)
- **Qualidade**: [ESLint](https://eslint.org/) & [Husky](https://typicode.github.io/husky/) (Git Hooks)

## 📁 Estrutura do Repositório

- `apps/web`: frontend React/Vite atual.
- `apps/api`: API Fastify com autenticação JWT e persistência em MongoDB.

## 📦 Começando

### Pré-requisitos
- Node.js (LTS recomendado)
- pnpm

### Instalação
```bash
# Clone o repositório
git clone https://github.com/Arateki/arateki-landing.git

# Instale as dependências
pnpm install

# Configure as variáveis de ambiente
cp apps/web/.env.example apps/web/.env # Garanta que VITE_GOOGLE_SCRIPT_URL esteja preenchido
```

### Rodando o Servidor de Desenvolvimento
```bash
pnpm dev
```

### Rodando a API
```bash
docker compose up -d mongodb
pnpm dev:api
```

## 🧪 Testes e Qualidade

Seguimos altos padrões de engenharia para garantir confiabilidade.

- **Testes de Unidade**: `pnpm test`
- **E2E e Regressão Visual**: `pnpm test:e2e`
- **Relatório de Cobertura**: `pnpm test:coverage`
- **Rodar Todos**: `pnpm test:all`

**Pre-commit Hook**: O Husky está configurado para rodar automaticamente o Lint e os Testes de Unidade antes de cada commit, impedindo que código quebrado chegue ao repositório.

## 🛡 Licença

Este projeto está licenciado sob a [Licença MIT](./LICENSE).

---
<p align="center">Construído pela Arateki</p>
