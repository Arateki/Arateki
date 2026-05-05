# SEO — Implementação Nível 1 + 2 + 3 + 3.5

Documento técnico que descreve toda a implementação de SEO entregue. Cobre **Nível 1 (fundação)**, **Nível 2 (structured data e feeds dinâmicos)**, **Nível 3 (URLs canônicas por produto, URLs por idioma com hreflang, e prerender estático)** e **Nível 3.5 (produtos prerenderizados, OG PNG e preload de fonte)**.

> **Status:** Funcional. `pnpm --filter @arateki/api test` 37/37 verde, `pnpm --filter @arateki/web test` 48/48 verde, `pnpm --filter @arateki/web build` ok (build executa prerender ao final).

---

## 1. Estratégia geral

O site é uma SPA React 19 + Vite com prerender estático para as rotas públicas indexáveis. Crawlers de redes sociais que não executam JavaScript (Twitter/X, Facebook, LinkedIn) devem receber `dist/index.html` ou os arquivos prerenderizados em `dist/<lang>[/sales]/index.html`, já com metadata por rota/idioma.

Para Nível 3 (prerender / SSR estático) e Nível 4 (Next.js/Remix), ver `docs/SEO-roadmap.md` (ainda a criar).

### Hierarquia de fontes de metadata

1. **`<Seo>` component** — fonte canônica de metadata por rota via React 19 native metadata hoisting (`<title>`, `<meta>`, `<link>` são içados automaticamente para `<head>`).
2. **`<JsonLd>` component** — renderiza `<script type="application/ld+json">` inline; o Google parseia JSON-LD em qualquer parte da página.
3. **`apps/web/index.html`** — template mínimo da SPA, com apenas tags globais que não variam por rota (`charset`, `viewport`, `theme-color`, ícones, manifest etc.). O build sobrescreve `dist/index.html` no prerender para entregar metadata rica também na raiz.

---

## 2. Arquivos novos

| Arquivo | Papel |
| --- | --- |
| `apps/web/src/lib/seo.ts` | `SITE_URL`, `canonical()`, `absoluteUrl()`, `ogLocale()`, `HTML_LANG`; imagem OG default em `/og-image.png`. |
| `apps/web/src/lib/structuredData.ts` | Builders JSON-LD: Organization, WebSite, FAQPage, BreadcrumbList, Product, ItemList. Inclui utilitário `nodeToText()` para converter `React.ReactNode` (FAQ com links/spans) em texto limpo. |
| `apps/web/src/components/common/Seo.tsx` | Componente declarativo de metadata por rota. |
| `apps/web/src/components/common/JsonLd.tsx` | Renderiza JSON-LD com escape de `<` para `<` (XSS-safe). |
| `apps/web/public/robots.txt` | `Disallow` em `/manage`, `/checkout`, `/api/`. Sitemaps referenciados. |
| `apps/web/public/sitemap.xml` | Sitemap estático com `/` e `/sales`. |
| `apps/web/public/manifest.webmanifest` | PWA manifest mínimo. |
| `apps/web/public/og-image.svg` | Fonte vetorial da OG image 1200×630, branding Arateki. |
| `apps/web/scripts/generate-og-image.mjs` | Gera `og-image.png` 1200×630 a partir do SVG usando Playwright no build. |
| `apps/api/src/http/sitemap-feed.ts` | Builder do sitemap dinâmico com produtos ativos. |

## 3. Arquivos modificados

| Arquivo | Mudança |
| --- | --- |
| `apps/web/index.html` | Shell HTML mínimo: `charset`, `viewport`, `author`, `theme-color`, `format-detection`, `referrer`, ícones e manifest. Metadata de rota fica exclusivamente em `<Seo>` para evitar tags duplicadas no prerender. |
| `apps/web/src/hooks/useAppConfig.ts` | Sincroniza `document.documentElement.lang` com o idioma atual usando tags BCP 47 (`pt-BR`, `en`, `es`, `zh-CN`, `ja`). |
| `apps/web/src/types/i18n.ts` | Novo bloco `seo: { home, sales, checkout }`. |
| `apps/web/src/i18n/translations.tsx` | Strings de SEO traduzidas para os 5 idiomas. |
| `apps/web/src/pages/Home.tsx` | Seo + JSON-LD Organization, WebSite, FAQPage (gerado de `t.faq.items`). |
| `apps/web/src/pages/Sales.tsx` | Seo dinâmico (título/descrição/og:image/path muda quando `/<lang>/sales/<id>` está ativo); JSON-LD BreadcrumbList, ItemList, Product[] (um por produto). |
| `apps/web/src/pages/Checkout.tsx` | Seo `noindex` + BreadcrumbList. |
| `apps/web/src/pages/admin/AdminLayout.tsx` | Seo `noindex` envolve todas rotas autenticadas. |
| `apps/web/src/pages/admin/AdminLogin.tsx` | Seo `noindex`. |
| `apps/web/src/components/common/Logos.tsx` | `alt="Arateki Logo"` → `alt="Arateki"` (anti-pattern: alt nunca deve dizer "logo"). |
| `apps/api/src/http/product-routes.ts` | Nova rota `GET /sitemap.xml` (sob prefixo `/api`). |
| `apps/api/src/http/routes.test.ts` | Teste de integração para o sitemap. |

---

## 4. Por rota

### Home (`/`)
- **Title:** `Arateki — Hardware open-source com foco em privacidade` (i18n).
- **Description:** Tagline da empresa, traduzida.
- **OG/Twitter:** website, image `og-image.png`, locale + alternates.
- **JSON-LD:** `Organization` (com `sameAs` apontando para os 3 repositórios GitHub), `WebSite`, `FAQPage` (gerado dinamicamente das perguntas em `t.faq.items`, com `nodeToText()` linearizando React nodes).

### Sales (`/<lang>/sales`)
- **Title estático:** `Loja Arateki — Componentes eletrônicos e produtos exclusivos`.
- **Title dinâmico:** quando `/<lang>/sales/<id>` abre o modal, vira `<nome do produto> — Arateki` e a description usa `product.description`. `og:image` aponta para a imagem do produto. `og:type` vira `product`. Canonical aponta para a URL canônica do produto.
- **JSON-LD:**
  - `BreadcrumbList`: Home → Loja.
  - `ItemList`: posições dos produtos no catálogo.
  - `Product[]`: um nó por produto, com `Offer` (preço, moeda, disponibilidade, condição, seller), `brand`, `sku`, `mpn`, `category`, `image`.

### Checkout (`/checkout`)
- **Title:** `Checkout — Arateki` (i18n).
- **`noindex, nofollow`** — não queremos checkout em SERP.
- **JSON-LD:** `BreadcrumbList` Home → Loja → Checkout.

### Admin (`/manage/*`)
- **`noindex, nofollow`** em `AdminLayout` (cobre dashboard/orders/products/settings) e `AdminLogin`.

---

## 5. Internacionalização

| `LangCode` | `<html lang>` | `og:locale` |
| --- | --- | --- |
| `pt` | `pt-BR` | `pt_BR` |
| `en` | `en` | `en_US` |
| `es` | `es` | `es_ES` |
| `zh` | `zh-CN` | `zh_CN` |
| `ja` | `ja` | `ja_JP` |

`og:locale:alternate` é emitido para todos os outros idiomas em cada página.

> **Limitação conhecida (Nível 3):** os 5 idiomas compartilham as URLs `/`, `/sales`, `/checkout` (idioma vive em `localStorage`), portanto não emitimos `<link rel="alternate" hreflang>` ainda. A migração para URLs por idioma (`/pt/`, `/en/`, etc.) está documentada no roadmap como Nível 3.

---

## 6. Sitemaps & robots

### `/sitemap.xml` (estático)
Servido pelo Vite a partir de `apps/web/public/sitemap.xml`. Apenas `/` e `/sales`. Funciona mesmo com a API offline.

### `/api/sitemap.xml` (dinâmico)
Servido pelo Fastify (`apps/api/src/http/product-routes.ts:104`). Inclui:
- `/` (changefreq `weekly`, priority 1.0)
- `/sales` (changefreq `daily`, priority 0.9)
- `/<lang>/sales/<id>` para cada produto ativo (changefreq `weekly`, priority 0.8, `<lastmod>` = `product.updatedAt` em ISO 8601)

Cache: `Cache-Control: public, max-age=3600`.

### `robots.txt`
- Permite `/`.
- Bloqueia `/manage`, `/checkout`, `/api/` (mas permite `/api/feeds/` para crawlers de shopping do Google/Meta/Microsoft consumirem o feed do catálogo já existente em `apps/api/src/http/catalog-feed.ts`).
- Lista ambos sitemaps (`Sitemap:` é multi-valor por especificação).

---

## 7. Structured data (Schema.org JSON-LD)

Todos os builders estão em `apps/web/src/lib/structuredData.ts`. Compatibilidade testável no [Rich Results Test](https://search.google.com/test/rich-results) e [Schema Markup Validator](https://validator.schema.org/).

### Organization
`@id` ancorado em `${SITE_URL}/#organization` para ser referenciado por `WebSite.publisher` e `Product.offers.seller` via `@id`.

### WebSite
`@id` em `${SITE_URL}/#website`. `inLanguage` reflete idioma corrente.

### FAQPage
Gerado dinamicamente de `t.faq.items`. O campo `a` é `React.ReactNode` (alguns itens têm spans e links para repositórios) — convertido para string via `nodeToText()` (recursivo, junta crianças com espaço, normaliza whitespace).

### Product
Um por produto na `/sales`. Inclui `Offer` com:
- `priceCurrency` da `ProductView.currency` (BRL ou USD por país).
- `availability` schema URL conforme `stock`.
- `itemCondition` `NewCondition` (estamos vendendo novo).
- `seller.@id` apontando para a Organization.

### BreadcrumbList & ItemList
Padrões clássicos para navegação e listagens. ItemList ajuda Google a entender o catálogo.

---

## 8. Open Graph image

`apps/web/public/og-image.svg` é a fonte editável. O build roda `apps/web/scripts/generate-og-image.mjs` e gera `apps/web/public/og-image.png` 1200×630, que é copiado para `dist/og-image.png` e usado por `og:image`/`twitter:image`.

---

## 9. Acessibilidade & detalhes

- **`alt` text:** `Logos.tsx` mudou de `"Arateki Logo"` para `"Arateki"` (anti-pattern: alt nunca deve descrever que algo é um logo, deve descrever o conteúdo).
- **`<meta name="referrer" content="strict-origin-when-cross-origin">`** — privacidade alinhada com a missão.
- **`<meta name="format-detection" content="telephone=no">`** — evita o iOS sublinhar números aleatórios como links de telefone.
- **`max-image-preview:large`** — permite imagens grandes em SERP.
- **Theme color responsivo** — `<meta name="theme-color">` muda entre `#F5F5F5` e `#111111` via media query, sincronizando barra de URL móvel com o tema.

---

## 10. Performance & Core Web Vitals

Não foram feitas mudanças de performance neste PR. Notas para Nível 3:

- **Preload Montserrat-Regular**: `App.tsx` importa `Montserrat-Regular.ttf` e emite `<link rel="preload" as="font">`, permitindo que o prerender use a URL hasheada correta do Vite. A fonte vive em `apps/web/src/assets/fonts/Montserrat-Regular.ttf`.
- **`ParticleBackground`** roda em todas as páginas; pode impactar LCP/CLS em mobile. Auditar com Lighthouse depois.

---

## 11. Como validar

### Local
```bash
pnpm --filter @arateki/api test       # 37/37 (inclui teste do sitemap)
pnpm --filter @arateki/web test       # 48/48
pnpm --filter @arateki/web build      # tsc + vite build
```

### URLs (após `pnpm dev`)
- `http://localhost:5173/robots.txt`
- `http://localhost:5173/sitemap.xml`
- `http://localhost:5173/manifest.webmanifest`
- `http://localhost:5173/og-image.svg`
- `http://localhost:5173/og-image.png`
- `http://localhost:3333/api/sitemap.xml` (com a API rodando)

### Ferramentas externas
- Rich Results Test: <https://search.google.com/test/rich-results>
- Schema Validator: <https://validator.schema.org/>
- Twitter Card Validator: <https://cards-dev.twitter.com/validator>
- Facebook Sharing Debugger: <https://developers.facebook.com/tools/debug/>
- Lighthouse SEO audit: chrome devtools

---

## 12. Variáveis de ambiente

```bash
# Frontend (build-time)
VITE_PUBLIC_SITE_URL=https://arateki.com   # canonical/og:url base; default https://arateki.com

# Backend (runtime, já existia)
PUBLIC_SITE_URL=https://arateki.com        # usado pelo sitemap dinâmico e pelos feeds
```

---

## 13. Nível 3 — URLs canônicas, multi-língua e prerender

### 13.1 URLs canônicas por produto (`/sales/:slug`)

Produtos agora têm URL própria indexável: `/<lang>/sales/<id>`. O `id` do produto é o slug (`sensor-dht22`, `esp32-wroom-32d`).

- **Roteamento** (`apps/web/src/App.tsx`): novo `<Route path="/:lang/sales/:productId" element={<Sales />} />`.
- **Sales.tsx**: `useParams<{ productId }>()` substitui o estado local. Clicar num card → `navigate('/<lang>/sales/<id>')`. Fechar modal → `navigate('/<lang>/sales', { replace: true })`. URL é a fonte de verdade do modal aberto.
- **Retrocompat**: `/sales?product=<id>` redireciona via `useEffect` para o slug canônico.
- **Feeds e structured data**: todos atualizados para emitir o novo formato:
  - `Product` JSON-LD: `@id` e `offers.url` apontam para `/<lang>/sales/<id>`.
  - Catalog feed (`apps/api/src/http/catalog-feed.ts`): `link` agora inclui `lang` (vem do query param `?lang=pt`).
  - Sitemap dinâmico: cada produto × 5 idiomas.

### 13.2 URLs por idioma (`/:lang/`) + hreflang

Idioma agora vive na URL, não apenas em localStorage. Estrutura:

```
/                         → RootRedirect → /<preferred-lang> baseado em localStorage / Accept-Language / fallback pt
/:lang                    → LangGuard → Home
/:lang/sales              → Sales
/:lang/sales/:productId   → Sales
/:lang/checkout           → Checkout
/sales, /sales/:id, /checkout (sem prefixo) → LegacyPathRedirect → /<lang>/<path>
/manage, /manage/login, …  → Admin (sem prefixo, intencional)
```

- **`useAppConfig`** (`apps/web/src/hooks/useAppConfig.ts`): lê lang do `useParams`; se ausente (admin), cai pro localStorage. `setLang(newLang)` re-navega para a versão equivalente da URL atual.
- **`HTML_LANG` map** centralizado em `lib/seo.ts`: `pt → pt-BR`, `en → en`, `es → es`, `zh → zh-CN`, `ja → ja`. Atributo `<html lang>` é sincronizado em runtime.
- **Hreflang nas páginas**: o componente `Seo` emite `<link rel="alternate" hreflang>` para os 5 idiomas + `x-default` (apontando para a URL sem prefixo, que redireciona).
- **Hreflang no prerender**: presente nos HTMLs gerados em `dist/<lang>[/sales]/index.html`, a partir do componente `Seo`.
- **Sitemap multi-língua**: `apps/api/src/http/sitemap-feed.ts` emite cada URL × 5 línguas com `<xhtml:link rel="alternate" hreflang>` por entrada (formato Google Sitemap).
- **Catalog feed** (Google/Meta/Microsoft Shopping): o `link` de cada produto inclui o lang requisitado (ex.: `?country=BR&lang=pt` → `/pt/sales/<id>`).

### 13.3 Prerender estático

Crawlers sem JS (Twitter/X, Facebook, LinkedIn, Discord) agora recebem HTML pré-renderizado por rota e idioma — com title, description, OG, hreflang e JSON-LD corretos no HTML servido pelo CDN.

- **Script**: `apps/web/scripts/prerender.mjs`. Sobe `vite preview` numa porta efêmera, abre cada rota num Chromium headless (Playwright já é devDep), espera o React 19 hidratar e salva `dist/index.html` ou `dist/<lang>/[sales/]index.html`.
- **Fonte única de metadata**: o template `apps/web/index.html` não contém title/description/canonical/OG/Twitter/hreflang. Essas tags são emitidas apenas pelo `Seo`, evitando dedupe ou heurística de remoção no script.
- **Mock de `/api/products`**: o script intercepta a requisição via `page.route`. Sem API, retorna `[]` e snapshota apenas home/store. Com `PRERENDER_API_BASE=http://localhost:3333`, busca produtos reais por idioma e snapshota URLs individuais.
- **Rotas snapshotadas sem API (11)**:
  - `/` (renderizado a partir de `/pt`, a home padrão)
  - `/pt`, `/en`, `/es`, `/zh`, `/ja`
  - `/pt/sales`, `/en/sales`, `/es/sales`, `/zh/sales`, `/ja/sales`
- **Rotas extras com API**:
  - `/<lang>/sales/<product-id>` para cada produto ativo retornado por `/api/products`.
- **Output**: cada uma vira `dist/index.html` ou `dist/<lang>[/sales]/index.html`. A raiz é gerada por último para não virar fallback rico durante os outros snapshots.
- **Comandos**:
  - `pnpm --filter @arateki/web build` — build + prerender (default).
  - `pnpm --filter @arateki/web build:no-prerender` — só `tsc + vite build` (CI sem Chromium / dev rápido).
  - `pnpm --filter @arateki/web prerender` — apenas prerender (sobre um build já existente).

### 13.4 Variáveis de ambiente do prerender

```bash
PRERENDER_PORT=4180                       # opcional; se omitido, usa porta livre automaticamente
PRERENDER_API_BASE=http://localhost:3333  # opcional; se setado, busca produtos reais
```

### 13.5 Nível 3.5 — polimento aplicado

- **Produtos individuais são prerenderizados quando a API está disponível no build** (`PRERENDER_API_BASE=http://127.0.0.1:3333`). O GitHub Actions sobe a API antes do build do frontend para isso.
- **PNG da OG image é gerado no build** a partir do SVG, evitando dependência de suporte a SVG em Twitter/X.
- **Montserrat Regular é preloadada** com o caminho hasheado do Vite nos snapshots.

### 13.6 Limitações conhecidas

- **`/manage/*`** não é prerenderizado nem indexável (defesa em profundidade: `noindex` + `Disallow` em robots.txt).
- **Hash links** (`/<lang>/#safrasense`) são prerenderizados como `/<lang>/index.html`; o ScrollToHash do React rola após hidratação. Crawler vê o HTML completo da Home; usuário vê o hash funcionar.

---

## 14. O que NÃO foi feito (Nível 4)

- Migração para Next.js / Remix / Vike — Nível 3 cobre prerender estático, suficiente para SEO. SSR completo só compensa se houver dynamic OG (ex.: previews de pedidos personalizados) ou hidratação progressiva crítica.

---

## 15. Checklist pós-deploy

Não existe garantia de indexação ou ranking: Google, Bing, ChatGPT Search e outros sistemas decidem quando rastrear, indexar e exibir conteúdo. O objetivo deste checklist é remover bloqueios técnicos e enviar sinais consistentes.

### 15.1 Publicação e Nginx

- Servir o conteúdo final de `apps/web/dist` em `/var/www/arateki`.
- Garantir que o Nginx usa `try_files $uri $uri/ /index.html;` para servir as pastas prerenderizadas antes do fallback SPA.
- Manter `/api/` com `proxy_pass http://127.0.0.1:3333;` sem rewrite, porque a API já registra rotas com prefixo `/api`.
- Redirecionar rotas antigas sem idioma em nível HTTP:
  - `/sales` → `/pt/sales`
  - `/sales/<id>` → `/pt/sales/<id>`
  - `/checkout` → `/pt/checkout`
- Publicar apenas HTTPS. Evitar que `http://arateki.com` e `www.arateki.com` fiquem servindo conteúdo duplicado; ambos devem redirecionar para `https://arateki.com`.

### 15.2 Validação manual imediata

Depois do deploy, rodar:

```bash
curl -I https://arateki.com/
curl -I https://arateki.com/pt
curl -I https://arateki.com/pt/sales
curl -I https://arateki.com/pt/sales/sensor-dht22
curl -I https://arateki.com/robots.txt
curl -I https://arateki.com/sitemap.xml
curl -I https://arateki.com/api/sitemap.xml
```

Verificar HTML bruto de algumas páginas:

```bash
curl -s https://arateki.com/pt | grep -E '<title>|name="description"|rel="canonical"|hreflang'
curl -s https://arateki.com/ja/sales/sensor-dht22 | grep -E '<title>|name="description"|rel="canonical"|og:type|hreflang'
```

Cada página pública deve ter:

- exatamente um `<title>`;
- exatamente uma `meta name="description"`;
- exatamente uma `link rel="canonical"`;
- `hreflang` para `pt-BR`, `en`, `es`, `zh-CN`, `ja` e `x-default`;
- HTML textual visível, não apenas um `<div id="root"></div>` vazio;
- status HTTP `200` para rotas canônicas e `301` para rotas antigas.

### 15.3 Google Search Console

Tarefas do proprietário do domínio:

1. Verificar a propriedade `arateki.com` no Google Search Console, preferencialmente como propriedade de domínio via DNS.
2. Enviar estes sitemaps:
   - `https://arateki.com/sitemap.xml`
   - `https://arateki.com/api/sitemap.xml`
3. Usar "Inspeção de URL" para solicitar indexação inicial de:
   - `https://arateki.com/`
   - `https://arateki.com/pt`
   - `https://arateki.com/pt/sales`
   - uma URL de produto, por exemplo `https://arateki.com/pt/sales/sensor-dht22`
4. Acompanhar "Páginas" e "Sitemaps" por erros de `noindex`, `robots.txt`, canonical inesperado, `404`, redirecionamento ou páginas descobertas mas não indexadas.
5. Depois de alguns dias, conferir o relatório de Performance. Tráfego vindo de AI Overviews/AI Mode aparece agregado no tipo de pesquisa "Web".

### 15.4 Ferramentas externas

Validar após publicar:

- Rich Results Test: `https://search.google.com/test/rich-results`
- Schema Markup Validator: `https://validator.schema.org/`
- Facebook Sharing Debugger: `https://developers.facebook.com/tools/debug/`
- Twitter/X Card Validator: `https://cards-dev.twitter.com/validator`
- Lighthouse no Chrome DevTools, focando SEO, Performance e Core Web Vitals.

### 15.5 Rotina de manutenção

- Quando produto mudar de nome, descrição, imagem ou disponibilidade de forma relevante, rodar novo deploy para regenerar os snapshots.
- Se só o estoque mudar, o site continua válido; o snapshot pode ficar defasado até o próximo deploy, mas URLs, metadata e structured data permanecem úteis.
- Se adicionar novas páginas editoriais ou manuais, incluir rota, `Seo`, JSON-LD quando aplicável, sitemap e prerender.
- Monitorar Search Console semanalmente no primeiro mês após o deploy.

---

## 16. Indexação por IA

O site está preparado para consumo por IAs que usam crawlers ou índices de busca porque entrega HTML prerenderizado, texto visível, metadata consistente, sitemap, canonical, hreflang e JSON-LD. Isso ajuda tanto buscadores tradicionais quanto sistemas de respostas com citações.

### 16.1 Google AI Overviews e AI Mode

Para aparecer como link de apoio em recursos de IA do Google, não há um markup especial nem arquivo específico adicional. A página precisa estar indexada e elegível para aparecer no Google Search com snippet. Portanto, as mesmas práticas fundamentais continuam valendo:

- permitir crawl em `robots.txt`;
- manter conteúdo importante em texto HTML;
- usar links `<a href="...">` rastreáveis;
- manter structured data compatível com o conteúdo visível;
- manter sitemap e canonical coerentes;
- garantir boa experiência e performance.

### 16.2 ChatGPT Search e crawlers da OpenAI

O `robots.txt` atual usa `User-agent: *`, permite `/` e bloqueia apenas áreas privadas ou técnicas (`/manage`, `/checkout`, `/api`), liberando `/api/feeds/`. Isso já permite `OAI-SearchBot` e `GPTBot` por padrão.

Se no futuro houver uma política editorial diferente, os controles podem ser separados:

- `OAI-SearchBot`: crawler usado para busca no ChatGPT. Permitir ajuda o site a aparecer em respostas com busca.
- `GPTBot`: crawler que pode ser usado para melhorar modelos. Bloquear isso não é a mesma coisa que bloquear busca.
- `ChatGPT-User`: acessos iniciados por ações do usuário; não é crawler automático de indexação.

Manter `OAI-SearchBot` permitido é recomendado se o objetivo é aparecer em ChatGPT Search. Não adicionar bloqueios específicos a bots de IA sem uma decisão explícita de política.

### 16.3 Arquivos para IA, como `llms.txt`

Não há exigência de `llms.txt` para aparecer em Google AI Overviews/AI Mode, e isso ainda não substitui sitemap, HTML rastreável, canonical, hreflang ou structured data.

Decisão atual: não adicionar `llms.txt` agora. O site já expõe as informações úteis em HTML prerenderizado e sitemaps. Se no futuro houver documentação longa, manuais técnicos ou páginas editoriais estáveis, pode fazer sentido adicionar um `llms.txt` simples apontando para:

- páginas institucionais;
- catálogo;
- documentação técnica;
- repositórios oficiais;
- termos de uso ou política de conteúdo, se existirem.

### 16.4 Conteúdo que IAs conseguem aproveitar melhor

Para melhorar respostas de IA com citações úteis, priorizar páginas com:

- títulos literais e descritivos;
- respostas objetivas em texto, especialmente FAQ;
- descrições de produto completas;
- especificações técnicas em listas ou tabelas;
- links internos claros;
- imagens com `alt` descritivo;
- dados estruturados que batem com o texto visível.

### 16.5 Referências oficiais

- Google Search Central — AI features and your website: `https://developers.google.com/search/docs/appearance/ai-overviews`
- Google Search Central — Technical requirements: `https://developers.google.com/search/docs/essentials/technical`
- Google Search Central — Link best practices: `https://developers.google.com/search/docs/crawling-indexing/links-crawlable`
- Google Search Central — Canonicalization: `https://developers.google.com/search/docs/crawling-indexing/canonicalization`
- OpenAI — Overview of OpenAI crawlers: `https://platform.openai.com/docs/bots`
