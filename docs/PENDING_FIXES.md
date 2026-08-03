# Pendências — Área Administrativa (`/manage`)

> **Nota (2026-08):** a API já usa **SQLite** (`node:sqlite`), não MongoDB. Ignore trechos deste documento que citam `Mongo*Repository` ou `mongodb-memory-server` — trate-os como histórico. Onde o texto falar em arquivo `mongo-*-repository.ts`, o equivalente atual está em `apps/api/src/infrastructure/sqlite/`.

Documento técnico para o agente que vai implementar as correções na área de administração de login, produtos, pedidos e cadastro.

> **Antes de começar**, leia `CLAUDE.md` na raiz. Esse documento assume conhecimento de:
> - Paleta de cores (não usar `#000`/`#FFF`)
> - Tipografia (labels pequenas: `font-semibold` + `opacity-70+`, nunca `font-light` + `opacity-50`)
> - i18n obrigatório nos 5 idiomas (pt, en, es, zh, ja)
> - Padrão de pastas (pages/components/hooks/services/context)

---

## 0. Pré-requisitos e validação

### Comandos
```bash
pnpm dev          # web dev server
pnpm dev:api      # API dev server (precisa Mongo rodando — ver docker-compose.yml)
pnpm build        # tsc + vite build (DEVE passar)
pnpm test         # vitest (web + api)
pnpm test:e2e     # playwright (web)
```

### Estado atual (snapshot)
- Build: **falhando** com 3 erros TypeScript (ver §1).
- Testes unitários: 28/28 API + 38/38 web passando.
- Testes E2E: existem `admin.spec.ts` e `admin-lifecycle.spec.ts`; rodar para confirmar baseline.

### Definition of Done geral
Antes de fechar qualquer tarefa abaixo:
1. `pnpm build` passa sem erro nem warning de import não usado.
2. `pnpm test` continua verde.
3. `pnpm test:e2e` continua verde (ou os testes foram atualizados conscientemente).
4. Nenhum `any` introduzido.
5. Nenhuma string de UI nova hardcoded fora de `translations.tsx`.

---

## 1. P0 — Bloqueadores de build

> Sem esses três, Husky bloqueia qualquer commit.

### 1.1 Adicionar `store.notifyMe` em `es` e `zh`

**Arquivos:** `apps/web/src/i18n/translations.tsx` linhas 285 e 379.

**Problema:** `TranslationType.store.notifyMe` é obrigatório (`apps/web/src/types/i18n.ts:30-35`), mas `es` e `zh` só têm `title` e `subtitle`.

**Solução:** adicionar a sub-chave `notifyMe` igual está em pt/en/ja (linhas 88-93, 188-193, 476-481), traduzida para os respectivos idiomas. Conteúdo: `title`, `desc`, `success`, `button`.

**Validar:** `pnpm build` deixa de reclamar de TS2741.

---

### 1.2 Remover import não usado em `Sales.tsx`

**Arquivo:** `apps/web/src/pages/Sales.tsx:2`

```diff
- import { ArrowRight, ShoppingCart } from 'lucide-react';
+ import { ArrowRight } from 'lucide-react';
```

`grep -n "ShoppingCart" apps/web/src/pages/Sales.tsx` deve retornar 0 resultados depois.

---

## 2. P1 — Bugs funcionais

> Esses bugs fazem features quebrarem em runtime.

### 2.1 `AdminProductForm` está incompleto — submit vai falhar com 400

**Arquivo:** `apps/web/src/pages/admin/AdminProductForm.tsx`

**Contexto:** o schema Zod do backend (`apps/api/src/http/schemas.ts:38-44`) exige:
- `name: { pt, en, es, zh, ja }` (todos `min(1).max(180)`)
- `description: { pt, en, es, zh, ja }` (todos `min(2).max(1000)`)
- `variants[].prices: { brlCents, usdCents }` (ambos obrigatórios)

**O formulário atual coleta apenas:**
- `name.pt` e `name.en` (linhas 145-162)
- `description.pt` (linhas 164-171)
- `prices.brlCents` (linha 209)

**Resultado:** quando o admin clica em "Salvar", a API rejeita com 400 (`description.en/es/zh/ja` são strings vazias e violam `min(2)`).

**Ação:**

1. Adicionar inputs de `name` e `description` para `es`, `zh`, `ja` (3 textareas a mais cada).
   - Sugestão de UX: tabs por idioma (PT | EN | ES | ZH | JA) ao invés de 10 campos empilhados, ou um accordion com "Traduções (4)".
2. Adicionar input para `prices.usdCents` por variante (linha ~209).
3. Substituir `parseInt(e.target.value)` por uma função segura:
   ```ts
   const toIntCents = (v: string): number => {
     const n = parseInt(v, 10);
     return Number.isFinite(n) && n >= 0 ? n : 0;
   };
   ```
4. Botão `Salvar` deve refletir modo: `{isEdit ? 'Salvar Alterações' : 'Criar Produto'}` (linha 268).

**Validar:**
- Criar produto novo via UI → 201 da API + redireciona para `/manage/products`.
- Editar produto existente → 200 + dados refletidos no `GET /products`.

---

### 2.2 Faltam endpoints `GET /admin/products/:id` e o frontend usa workaround ineficiente

**Arquivo:** `apps/web/src/pages/admin/AdminProductForm.tsx:36-40`

```ts
const products = await adminProductService.getProducts(token);
const product = products.find(p => p.id === id);
```

Busca a lista inteira só pra pegar um item.

**Ação backend** (`apps/api/src/http/product-routes.ts`):
1. Criar use case `GetAdminProductUseCase` em `apps/api/src/application/get-admin-product.ts` análogo ao `GetOrderUseCase`.
2. Registrar rota `GET /admin/products/:id` em `product-routes.ts`, protegida por `authenticateAdmin`. Retornar 404 se não existir.
3. Adicionar teste em `apps/api/src/http/routes.test.ts` cobrindo: 401 sem token, 404 inexistente, 200 com produto.

**Ação frontend** (`apps/web/src/services/adminProductService.ts`):
1. Adicionar método `getProduct(token, id): Promise<RawProduct>`.
2. Em `AdminProductForm.tsx:36-40`, substituir a busca da lista por essa nova chamada.

---

### 2.3 `<select>` nativo + `alert()` em `AdminOrders` violam padrão

**Arquivo:** `apps/web/src/pages/admin/AdminOrders.tsx:93-103, 44`

**Problema:** o `<select>` nativo ignora CSS no popup de opções (regra explícita do CLAUDE.md). E `alert()` quebra o estilo visual.

**Ação:**
1. Substituir o `<select>` por um dropdown customizado com `div`/`button`. Referência de implementação no projeto: `apps/web/src/pages/Checkout.tsx` (LangSelector). Manter as cores de status atuais por estado.
2. Substituir `alert(...)` (linha 44) por feedback inline ou toast. Sugestão simples: estado local `feedback: { kind: 'error' | 'success', msg: string } | null` exibido como banner no topo da tabela, auto-some em 3s.

**Validar:**
- Mudança de status funciona; popup de opções respeita dark theme.
- Erro de update mostra banner, não popup nativo.
- Atualizar `apps/web/tests/e2e/admin-lifecycle.spec.ts` (`Admin Order Lifecycle`) — hoje usa `selectOption` do Playwright; precisará trocar pelo padrão de click-no-botão-click-na-opção.

---

### 2.4 `alert()` em `AdminProductForm`

**Arquivo:** `apps/web/src/pages/admin/AdminProductForm.tsx:71, 79`

**Ação:** mesmo padrão do 2.3. Banner inline na seção "Mídia" para erros de upload (>5MB ou falha de processamento).

---

### 2.5 `parseInt(NaN)` no formulário

Coberto em §2.1 item 3. Mencionado isolado para o agente não esquecer caso pegue só §2.5 separado.

---

### 2.6 `useEffect` com dependências incompletas

**Arquivos:**
- `apps/web/src/pages/admin/AdminOrders.tsx:34-36`
- `apps/web/src/pages/admin/AdminProducts.tsx:27-29`

```ts
useEffect(() => {
  fetchOrders();
}, [token]);
```

`fetchOrders` é declarado fora do effect, então o React Hooks lint exige que esteja nas deps (ou esteja envolto em `useCallback`).

**Ação:** mover `fetchOrders` para dentro do `useEffect` (mais simples) ou envolvê-lo em `useCallback([token])` e listá-lo nas deps. Mesma coisa para `AdminProducts`.

---

## 3. P2 — Segurança

### 3.1 Secrets no `docker-compose.yml`

**Arquivo:** `docker-compose.yml:31-34`

```yaml
- JWT_SECRET=sua-chave-secreta-aqui
- ADMIN_PASSWORD=troque-me-depois-com-mais-de-12-chars
```

Esses valores estão **versionados**. JWT_SECRET hardcoded permite forjar tokens em qualquer deploy que use o compose como está.

**Ação:**
1. Criar `.env.example` na raiz com chaves vazias e instruções:
   ```dotenv
   JWT_SECRET=
   ADMIN_LOGIN=admin
   ADMIN_PASSWORD=
   ```
2. Garantir `.env` no `.gitignore` (verificar primeiro).
3. Trocar `docker-compose.yml` para referenciar variáveis obrigatórias com default-fail:
   ```yaml
   - JWT_SECRET=${JWT_SECRET:?JWT_SECRET is required}
   - ADMIN_PASSWORD=${ADMIN_PASSWORD:?ADMIN_PASSWORD is required}
   ```
4. README.md ganha uma seção curta "Configuração local: copie `.env.example` para `.env` e preencha".

**Validar:** `docker compose config` deve falhar com mensagem clara se rodar sem `.env`.

---

### 3.2 CORS e cabeçalhos de segurança

**Arquivo:** `apps/api/src/app.ts`

A API hoje não registra `@fastify/cors` nem `@fastify/helmet`. Em deploy onde frontend e API estão em domínios diferentes, fetch admin cai por CORS.

**Ação:**
1. Adicionar deps no `apps/api/package.json`:
   ```bash
   pnpm --filter @arateki/api add @fastify/cors @fastify/helmet
   ```
2. Em `app.ts`, depois do registro do JWT, antes das rotas:
   ```ts
   await app.register(helmet);
   await app.register(cors, {
     origin: process.env.CORS_ORIGIN?.split(',') ?? false, // false = same-origin only
     credentials: true,
   });
   ```
3. Adicionar `CORS_ORIGIN` em `apps/api/src/config/env.ts` (opcional, default vazio = same-origin).
4. Documentar a env var no `.env.example`.

**Validar:** `OPTIONS /products` retorna headers CORS quando `CORS_ORIGIN` permite, e bloqueia caso contrário.

---

### 3.3 Token admin em `localStorage` é vulnerável a XSS

**Decisão tomada:** não migrar para cookie httpOnly agora. O admin fica sem cookies, usando bearer token em `Authorization`, armazenado em `sessionStorage` em vez de `localStorage`, com renovação automática via `POST /refresh` enquanto o painel estiver aberto. Ao fechar tudo e voltar outro dia, o admin pode precisar logar novamente; manter "remember me" por dias sem cookie exigiria persistir um segredo acessível ao JavaScript.

**Arquivo:** `apps/web/src/services/authService.ts`

Hoje o JWT vai pra `localStorage` e o frontend o anexa em `Authorization: Bearer ...`. Qualquer XSS (incluindo de dependência transitiva comprometida) lê o token e faz qualquer chamada admin.

Histórico da decisão discutida:

**Opção A — manter localStorage, mitigar:**
- Adicionar `@fastify/helmet` com CSP estrito (cobre §3.2).
- Reduzir `JWT_EXPIRES_IN` para 15-30min e implementar refresh via rota `/refresh` (token de refresh httpOnly cookie).
- Manter `tokenVersion` + `jti` que já estão lá.

**Opção B — migrar para httpOnly cookie:**
- API passa a setar `Set-Cookie: arateki-admin-token=<jwt>; HttpOnly; Secure; SameSite=Strict; Path=/` no `POST /login`.
- API lê token de cookie em `authenticateAdmin` (`request.cookies.['arateki-admin-token']`) — adicionar `@fastify/cookie`.
- `POST /logout` zera o cookie + revoga `jti`.
- Frontend não armazena token em JS; remover `authService.getToken/setToken/removeToken`.
- `AuthProvider` precisa de outro sinal de "estou autenticado" — chamar `GET /me` na montagem e considerar autenticado se 200.
- Precisa CSRF protection (token CSRF em meta tag ou header `X-CSRF-Token`) porque cookie é enviado automaticamente.
- Esse caminho mexe em vários arquivos; tratar como tarefa separada se decidir por ele.

**Ação implementada:** `JWT_EXPIRES_IN` no `docker-compose.yml` usa default `2h`, `POST /refresh` revoga o `jti` antigo e emite novo JWT, e o front renova antes do `exp`.

---

### 3.4 Rate-limit só em `/login`

**Arquivo:** `apps/api/src/app.ts:46-48`

```ts
await app.register(rateLimit, { global: false });
```

`global: false` deixa todas as rotas (exceto `/login`, que define própria config) sem limite. Endpoints admin (`/admin/products`, `/orders/:id/status`) não têm proteção contra abuso por token vazado.

**Ação:** trocar para limite global moderado e manter o limite estrito do login:
```ts
await app.register(rateLimit, {
  global: true,
  max: 100,
  timeWindow: '1 minute',
});
```
Login continua com `{ max: 5, timeWindow: '1 minute' }` na config local da rota — é o caminho mais restritivo e ganha precedência.

**Validar:** chamar `GET /products` 200 vezes em 1min retorna 429 nas excedentes; login continua limitado a 5/min.

---

### 3.5 `bodyLimit` da API

**Arquivo:** `apps/api/src/app.ts:35-37`

`AdminProductForm` envia imagens como base64 no campo `imageUrl`. Sem `bodyLimit`, alguém com token admin pode enviar payloads enormes e estressar o servidor.

**Ação:**
```ts
const app = Fastify({
  logger: process.env.NODE_ENV !== 'test',
  bodyLimit: 5 * 1024 * 1024, // 5MB — suficiente para 1 imagem 800x800 em base64
});
```

E no schema (`apps/api/src/http/schemas.ts:41`):
```ts
imageUrl: z.string().trim().min(1).max(7_500_000).optional(),
// ~5MB binário = ~6.7MB base64; folga de 800kb pro prefixo "data:image/webp;base64,"
```

> Nota: longo prazo, recomendar object storage (S3 compat) e armazenar só URL no DB. Fora do escopo desse doc.

---

### 3.6 Audit log

Não há registro de quem trocou status de pedido X, ou criou produto Y. Em e-commerce isso é importante.

**Ação (escopo mínimo):**
1. Domain: `apps/api/src/domain/audit-log.ts` com `AuditLog { id, userId, action, entityType, entityId, before?, after?, at }` e `AuditLogRepository.record(entry): Promise<void>`.
2. Infrastructure: `MongoAuditLogRepository`. Index em `entityId` e `at`.
3. Hook nos use cases mutadores: `UpdateOrderStatusUseCase`, `CreateProductUseCase`, `UpdateProductUseCase`, `ChangePasswordUseCase`. Receber `userId` por argumento.
4. Não expor endpoint público ainda; só persistir.

> Marcar como **opcional** se prazo apertado. Os outros itens P2 são mais urgentes.

---

## 4. P2 — Padrões de código (CLAUDE.md)

### 4.1 Eliminar `any`

Lista exata:

| Arquivo | Linhas | Como tipar |
|---|---|---|
| `apps/api/src/infrastructure/mongo-product-repository.ts` | 79 | Já tem o tipo certo: `input.variants` é `ProductVariantInput[]`. Apenas tirar `: any`. |
| `apps/web/src/pages/admin/AdminLogin.tsx` | 23 | `catch (err)` + `const message = err instanceof Error ? err.message : 'Erro ao realizar login.'` |
| `apps/web/src/pages/admin/AdminOrders.tsx` | 27, 43 | idem padrão acima |
| `apps/web/src/pages/admin/AdminProducts.tsx` | 20 | idem |
| `apps/web/src/pages/admin/AdminProductForm.tsx` | 56, 113 | idem |
| `apps/web/src/pages/admin/AdminProductForm.tsx` | 83 (`value: any`) | criar union type discriminado: ver snippet abaixo |
| `apps/web/src/pages/admin/AdminProductForm.tsx` | 90, 92 (`(variant as any)`) | reescrever sem cast (snippet abaixo) |
| `apps/web/src/services/productService.ts` | 15 (`(p: any)`) | tipar como `ProductView` da API ou criar tipo dedicado no frontend |

Snippet sugerido para `handleVariantChange` (substitui `field: string, value: any`):

```ts
type VariantField =
  | { kind: 'top'; field: 'sku' | 'stock' }
  | { kind: 'attributes'; key: string }
  | { kind: 'prices'; key: 'brlCents' | 'usdCents' };

const handleVariantChange = (index: number, target: VariantField, value: string | number) => {
  setForm(prev => {
    const variant = prev.variants[index];
    if (!variant) return prev;
    let updated = variant;
    if (target.kind === 'top') {
      updated = { ...variant, [target.field]: value };
    } else if (target.kind === 'attributes') {
      updated = { ...variant, attributes: { ...variant.attributes, [target.key]: String(value) } };
    } else {
      updated = { ...variant, prices: { ...variant.prices, [target.key]: Number(value) } };
    }
    const next = [...prev.variants];
    next[index] = updated;
    return { ...prev, variants: next };
  });
};
```

Os call sites mudam para:
```ts
onChange={e => handleVariantChange(idx, { kind: 'top', field: 'sku' }, e.target.value)}
onChange={e => handleVariantChange(idx, { kind: 'prices', key: 'brlCents' }, toIntCents(e.target.value))}
```

---

### 4.2 Padronizar paleta nas telas admin

Hoje as páginas admin estão hardcoded em modo escuro (`bg-[#111111]`, `text-[#E8E8E8]`).

**Decisão necessária:** o admin deve ser dark-only ou seguir o toggle do `useAppConfig`?

- **Dark-only:** documentar em `CLAUDE.md` numa seção "Admin area". Ainda assim, garantir que toda cor está na paleta da tabela.
- **Tema dinâmico:** envolver páginas admin em `useAppConfig` e propagar `theme` igual a `Home`/`Sales`/`Checkout`. Mais trabalho.

Implementação de qualquer caminho fica fora desse doc até decisão. Por enquanto, marcar como **não bloqueador**.

---

### 4.3 Tipografia das labels

**Arquivo:** `apps/web/src/pages/admin/AdminProductForm.tsx`

Linhas com `opacity-50` em labels pequenas violam a regra "labels devem ter `font-semibold` + `opacity-70+`":
- 143 (`text-sm uppercase tracking-widest font-bold opacity-50`) — "Informações Básicas"
- 176 — "Variantes"
- 200, 204, 208, 212 — labels `text-[10px]` das variantes (SKU, Modelo, Preço, Estoque)
- 225 — "Mídia"
- 247 — "Recomendado: 800x800px..." (texto secundário, opacity OK aqui mas font-medium ajuda)

**Ação:** trocar `opacity-50` por `opacity-80` e garantir `font-semibold` (ou `font-bold`) em todas. Para textos secundários como linha 247, usar `font-medium opacity-70`.

---

### 4.4 Decisão de i18n no admin

Hoje todas as strings das páginas `/manage/*` estão hardcoded em PT (`AdminLogin`, `AdminLayout`, `AdminOrders`, `AdminProducts`, `AdminProductForm`).

Antes de aplicar a regra dos 5 idiomas, **confirmar com o usuário**: o admin é uso interno só em PT, ou deve ser internacionalizado?

- **Se PT-only:** adicionar à seção `Architecture Rules > Internationalisation` do `CLAUDE.md` uma linha "Páginas em `/manage/*` são PT-only por escolha de design — admin interno". Sem ação de código.
- **Se i18n completo:** mover todas as strings para `translations.tsx` numa nova chave `admin: { login: {...}, orders: {...}, products: {...}, common: {...} }`, atualizar `TranslationType`, e propagar `t.admin` via prop ou hook nas páginas admin.

---

## 5. P3 — Limpeza de qualidade na API

### 5.1 `update-product` com 2 queries

**Arquivo:** `apps/api/src/infrastructure/mongo-product-repository.ts:66-90`

Faz `findById` + `replaceOne` (duas roundtrips). Pode usar `findOneAndReplace` com `returnDocument: 'after'` numa só. Junto disso, tirar o `: any` mencionado em §4.1.

```ts
async update(id: string, input: ProductInput): Promise<Product | null> {
  const existing = await this.findById(id);
  if (!existing) return null;
  const now = new Date();
  const product: Product = {
    ...existing,
    name: input.name,
    description: input.description,
    imageUrl: input.imageUrl,
    variants: input.variants.map(variant => ({
      id: variant.id ?? randomUUID(),
      sku: variant.sku,
      attributes: variant.attributes,
      prices: variant.prices,
      stock: variant.stock,
      active: variant.active ?? true,
    })),
    active: input.active ?? existing.active,
    updatedAt: now,
  };
  await this.collection.replaceOne({ _id: id }, toDocument(product));
  return product;
}
```

(Refactor opcional para `findOneAndReplace` se quiser uma única query, mas o código acima já é correto e tipado — escolher conforme apetite.)

---

### 5.2 Comentário confuso em `update-order-status.ts`

**Arquivo:** `apps/api/src/application/update-order-status.ts:14-23`

O comentário inline diz "Could be either not found, or same status. To distinguish...". Mas o repo `MongoOrderRepository.updateStatus` sempre seta `updatedAt: new Date()`, então `modifiedCount === 0` significa documento não encontrado.

**Ação:** simplificar o use case e o comentário:

```ts
async execute(id: string, status: OrderStatus): Promise<void> {
  const updated = await this.orders.updateStatus(id, status);
  if (!updated) {
    throw new UpdateOrderStatusError('ORDER_NOT_FOUND');
  }
}
```

A query extra `findById` deixa de ser necessária.

---

## 6. Testes a atualizar / criar

| Suíte | Arquivo | Novo / atualizar |
|---|---|---|
| API unit | `apps/api/src/http/routes.test.ts` | Adicionar caso `GET /admin/products/:id` (200, 401, 404). |
| API unit | `apps/api/src/application/get-admin-product.test.ts` | Criar caso de teste do novo use case. |
| Web unit | `apps/web/src/services/adminProductService.test.ts` | Adicionar teste do método `getProduct(token, id)`. |
| Web unit | `apps/web/src/pages/admin/AdminProductForm.test.tsx` | Criar suite cobrindo: render em modo create, render em modo edit (com mock de `getProduct`), submit válido com todos os 5 idiomas, submit inválido (descrição < 2 chars). |
| E2E | `apps/web/tests/e2e/admin-lifecycle.spec.ts` (`Admin Order Lifecycle`) | Trocar `selectOption` pelo padrão click-no-trigger / click-na-opção do dropdown custom. |
| E2E | `apps/web/tests/e2e/admin-lifecycle.spec.ts` (`Admin Full Product Lifecycle`) | Atualizar fills para refletir os campos novos (10 inputs de name/desc + USD price). |

---

## 7. Resumo executivo (checklist)

Marque conforme for terminando.

### P0 (build)
- [x] §1.1 — `notifyMe` em `es` e `zh`
- [x] §1.2 — Remover `ShoppingCart` import de `Sales.tsx`

### P1 (funcional)
- [x] §2.1 — Completar `AdminProductForm` (5 idiomas, USD, parseInt safe, label do botão)
- [x] §2.2 — Endpoint `GET /admin/products/:id` + uso no frontend
- [x] §2.3 — Substituir `<select>` por dropdown custom em `AdminOrders` + remover `alert()`
- [x] §2.4 — Substituir `alert()` em `AdminProductForm` por feedback inline
- [x] §2.6 — Corrigir deps de `useEffect` em `AdminOrders` e `AdminProducts`

### P2 (segurança)
- [x] §3.1 — Tirar secrets do `docker-compose.yml`, criar `.env.example`
- [x] §3.2 — Registrar `@fastify/cors` e `@fastify/helmet`
- [x] §3.3 — **Decidir com o usuário** localStorage vs cookie httpOnly e implementar
- [x] §3.4 — Rate-limit global
- [x] §3.5 — `bodyLimit` no Fastify + `imageUrl.max` no Zod
- [x] §3.6 — Audit log mínimo implementado sem endpoint público

### P2 (padrão)
- [x] §4.1 — Eliminar todos os `any`
- [x] §4.2 — Admin com tema dinâmico e seletor no header
- [x] §4.3 — Corrigir tipografia das labels em `AdminProductForm`
- [x] §4.4 — i18n completo no admin

### P3 (qualidade)
- [x] §5.1 — Refactor `MongoProductRepository.update`
- [x] §5.2 — Simplificar `UpdateOrderStatusUseCase`

### Testes
- [x] §6 — Atualizar suítes listadas
- [x] Rodar `pnpm build && pnpm test && pnpm test:e2e` → tudo verde
  - `pnpm build`: verde.
  - `pnpm test`: verde fora do sandbox; dentro do sandbox o MongoMemoryServer falha ao abrir porta local com `listen EPERM`.
  - E2E admin focado: `pnpm --filter @arateki/web exec playwright test tests/e2e/admin.spec.ts tests/e2e/admin-lifecycle.spec.ts` verde.
  - `pnpm test:e2e`: verde depois de atualizar o snapshot esperado da home para refletir o CTA `Store` atual.

---

## 8. Pontos a NÃO mexer

Para o agente não criar trabalho desnecessário:

- A camada de auth do backend (`http/auth.ts`, `http/auth-routes.ts`, `infrastructure/password-hasher.ts`, use cases `login`/`change-password`/`revoke-token`/`bootstrap-admin`) está sólida. Mexer só se §3.3 mudar.
- Schemas Zod (`http/schemas.ts`) estão bem dimensionados — só ampliar `imageUrl.max` em §3.5.
- `CreateOrderUseCase` com transação e `decrementStock` está correto — não mexer.
- Cobertura existente em `routes.test.ts` é referência; novos testes seguem o mesmo estilo (`testApp.app.inject`).
- `AuthContext` / `useAuth` / `ProtectedRoute` estão minimalistas e corretos. Só mudam se §3.3 escolher cookie httpOnly.

---

## 9. Decisões do usuário

Antes de finalizar P2/P3, confirmar com o usuário:

1. **Tema admin** (§4.2): tema dinâmico igual ao site público, com seletor no header.
2. **i18n admin** (§4.4): `/manage/*` tem i18n completo nos 5 idiomas.
3. **Audit log** (§3.6): implementado agora, persistindo mutações admin em `audit_logs`.

Essas decisões já estão refletidas na implementação atual.

---

## 10. Pendência de deploy — EC2 T3 Nano

O deploy para o servidor principal Arch Linux foi corrigido e validado depois de ajustar o runner self-hosted.

Ainda falta ajustar e validar o alvo manual `ec2-t3-nano` no GitHub Actions:

- [ ] Confirmar que existe um runner online com labels `self-hosted` e `ec2-t3-nano`.
- [ ] Validar se o caminho `FRONT_PATH=/var/www/arateki/dist-front` existe e tem permissão de escrita para o runner.
- [ ] Confirmar que Docker e Docker Compose estão disponíveis no runner T3 Nano.
- [ ] Testar o fluxo `workflow_dispatch` com target `ec2-t3-nano`.
- [ ] Verificar se a máquina aguenta carregar a imagem `arateki-api` e subir `mongodb api` sem estourar memória/disco.
- [ ] Se necessário, ajustar o workflow para o T3 Nano usar um caminho/processo de deploy mais leve que o Arch.
