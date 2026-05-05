# Feeds de Catálogo de Produtos

Documento técnico que descreve a implementação dos feeds de catálogo expostos pela API para integração com plataformas de _online shopping_ (Google Merchant Center, Meta Commerce Manager, Microsoft Merchant Center, etc.).

> **Status:** Funcional, com testes automatizados passando (`pnpm --filter @arateki/api test` — 36/36 verdes, incluindo os casos específicos de feed).

---

## 1. Visão geral

A API publica três endpoints públicos (sem autenticação) que materializam o catálogo atual em formatos aceitos pelas principais plataformas de anúncios e marketplaces:

| Endpoint                              | Content-Type                          | Caso de uso principal                                |
| ------------------------------------- | ------------------------------------- | ---------------------------------------------------- |
| `GET /api/feeds/google-shopping.xml`  | `application/rss+xml; charset=utf-8`  | Google Merchant Center (RSS 2.0 + namespace `g:`)    |
| `GET /api/feeds/products.tsv`         | `text/tab-separated-values; charset=utf-8` | Google/Microsoft (planilha tab-separated)        |
| `GET /api/feeds/meta-catalog.csv`     | `text/csv; charset=utf-8`             | Meta Commerce Manager (Facebook/Instagram Shops)     |

Todos aceitam os mesmos query params de `/api/products`:

- `country` — `BR` retorna preços em `BRL`; qualquer outro valor (ou ausência) retorna `USD`.
- `lang` — idioma usado para nome/descrição (`pt | en | es | zh | ja`); default `pt` nos feeds, `en` em `/products`.

### Exemplos

```
GET /api/feeds/google-shopping.xml?country=BR&lang=pt
GET /api/feeds/products.tsv?country=US&lang=en
GET /api/feeds/meta-catalog.csv?country=US&lang=en
```

---

## 2. Arquivos

| Arquivo                                              | Papel                                                                         |
| ---------------------------------------------------- | ----------------------------------------------------------------------------- |
| `apps/api/src/http/catalog-feed.ts`                  | Construtores puros de XML/TSV/CSV + resolução do `siteUrl`.                   |
| `apps/api/src/http/product-routes.ts`                | Registro dos três endpoints no Fastify, reaproveitando `ListProductsUseCase`. |
| `apps/api/src/http/routes.test.ts`                   | Testes de integração que cobrem os três formatos.                             |
| `apps/api/src/config/env.ts`                         | Carregamento de `PUBLIC_SITE_URL`.                                            |
| `apps/api/src/app.ts` / `apps/api/src/main.ts`       | Propagação do `publicSiteUrl` até o registro das rotas.                       |
| `.env.example` / `apps/api/.env.example`             | Documentação do novo env var.                                                 |
| `apps/web/src/pages/Sales.tsx`                       | Abertura automática do modal do produto quando o usuário chega via `?product=...` (deep-link gerado pelos feeds). |
| `apps/web/tests/e2e/sales.spec.ts`                   | Teste E2E do deep-link do catálogo.                                           |

---

## 3. Modelo de dados (`CatalogOffer`)

Cada produto é convertido em uma oferta com os campos exigidos pelas três plataformas:

```ts
{
  id, title, description,
  availability: 'in stock' | 'out of stock',
  condition: 'new',
  price: '32.90 BRL',                        // formato "<valor> <ISO 4217>"
  link: 'https://site/sales?product=<id>',   // deep-link para o modal do produto
  imageLink,
  brand: 'Arateki',
  mpn: <SKU da variante ativa>,
  googleProductCategory: 'Electronics > Electronics Accessories',
  productType: 'Electronics > Components',
}
```

### Regras de filtragem (`buildCatalogOffers`)

Um produto é **omitido** do feed quando:

1. Nenhuma variante ativa existe (`product.variants.find(v => v.active)`); ou
2. O produto não tem `imageUrl`; ou
3. `priceCents <= 0`.

Quando há ao menos uma variante ativa **com estoque**, ela é preferida; caso contrário, qualquer variante ativa é usada e a disponibilidade vira `out of stock`.

---

## 4. Resolução do `siteUrl`

`getCatalogSiteUrl(request, configuredSiteUrl?)` define a base usada nos campos `link`/`image_link`:

1. Se `PUBLIC_SITE_URL` está configurado, vence (com `trimTrailingSlash`).
2. Caso contrário, usa `x-forwarded-host` (e `x-forwarded-proto`) ou cai em `host` do request.
3. Se o host começa com `localhost`, força `http`; caso contrário, `https`.

Imagens com path relativo (`/foo.png` ou `foo.png`) são absolutizadas; imagens já com `http(s)://` são preservadas.

---

## 5. Sanitização e escaping

- `sanitizeCell` colapsa quebras de linha e espaços múltiplos em um único espaço, o que é obrigatório para TSV (delimitador `\t`) e desejável para CSV/XML.
- `escapeXml` escapa `& < > " '` após sanitizar.
- `csvCell` envolve em aspas duplas e duplica `"` interno.

Sem essas etapas, descrições com vírgula, tabs ou aspas quebrariam o parser dos importadores.

---

## 6. Variável de ambiente

```bash
# .env / apps/api/.env
PUBLIC_SITE_URL=https://arateki.com
```

- Se ausente em desenvolvimento, a API infere a partir dos cabeçalhos do request (útil em túneis e previews).
- **Em produção, configure explicitamente** para garantir que os links dos feeds apontem para o domínio público canônico, mesmo quando o request chega via gateway interno.

---

## 7. Deep-link `/sales?product=<id>`

Os campos `link` apontam para `${siteUrl}/sales?product=<id>`. A página `Sales.tsx` lê o query param e abre automaticamente o `ProductModal` correspondente:

- Se o usuário fechar o modal, o estado `dismissedCatalogProductId` evita reabrir até que outro produto seja selecionado manualmente.
- Cobertura: `apps/web/tests/e2e/sales.spec.ts → "should open product details from a catalog product link"`.

---

## 8. Testes

### Unit/integração (Vitest, `apps/api/src/http/routes.test.ts`)

- `serves a Google Merchant Center compatible RSS product feed` — valida content-type, header `<rss xmlns:g=...>`, presença de `<g:id>`, `<title>`, `<g:price>`, `<g:availability>`, `<g:brand>`, `<g:mpn>` e `<link>` apontando para o `siteUrl` configurado em testes (`https://arateki.test`).
- `serves spreadsheet feeds for Meta, Google and Microsoft catalog imports` — valida content-types, cabeçalhos exatos das colunas TSV/CSV e o conteúdo de uma linha de produto.

### E2E (Playwright, `apps/web/tests/e2e/sales.spec.ts`)

- `should open product details from a catalog product link` — mocka `/api/products` e abre `/sales?product=sensor-dht22`, esperando o heading do produto visível.

### Como executar

```bash
pnpm --filter @arateki/api test          # roda apenas a suíte da API (inclui os testes de feed)
pnpm test                                 # web + api (vitest)
pnpm test:e2e                             # E2E web (Playwright)
```

Status atual (snapshot): **API 36/36 verdes**.

---

## 9. Pontos de extensão

- Adicionar campos opcionais (`gtin`, `sale_price`, `shipping`) requer apenas estender `CatalogOffer`, `catalogColumns()` e `columnValue()`, e atualizar os builders.
- Para suportar múltiplas variantes por produto (uma oferta por SKU), trocar `flatMap` em `buildCatalogOffers` para iterar `product.variants.filter(v => v.active)` em vez de pegar a primeira.
- Para feeds locais (ex.: `pt-BR.xml`), basta criar uma rota nova passando `lang`/`country` específicos.
