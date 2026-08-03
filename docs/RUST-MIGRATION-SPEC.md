# Arateki — SPEC: Migração da API para Rust + SQLite

- **Status:** Em implementação (`apps/api-rs`) — Node+SQLite já em `main` (PR #1)
- **Data:** 2026-06-24 (início implementação 2026-08-03)
- **Alvo de deploy:** AWS EC2 `t3.nano` (512 MB RAM) em bare-metal, sem Docker
- **Documento irmão:** [`SQLITE-BAREMETAL-SPEC.md`](./SQLITE-BAREMETAL-SPEC.md)
- **Estratégia de testes:** portar cenários de `apps/api/src/http/routes.test.ts` para `cargo test` e só então fechar paridade de implementação

---

## 1. Objetivo

Reescrever a API (`apps/api`, hoje Fastify + MongoDB) em **Rust + SQLite**, entregando um **binário estático único** com footprint mínimo (~20 MB residentes), rodando bare-metal via systemd, e **atualizar o CI** para compilar (cross-compile) e fazer deploy desse binário sem Docker.

## 2. Contexto e motivação

Esta spec é a alternativa "máxima eficiência" à [`SQLITE-BAREMETAL-SPEC.md`](./SQLITE-BAREMETAL-SPEC.md). O gargalo de RAM na `t3.nano` é o **MongoDB**, que ambas as specs eliminam. A diferença entre elas:

| | SQLite + Node | Rust + SQLite |
|---|---|---|
| RAM da API | 80–130 MB | 10–25 MB |
| Esforço | ~1–2 dias (mecânico) | ~1–3 semanas (rewrite) |
| Reaproveita TS/testes | Sim | Não |
| Artefato | `dist/` + `node_modules` | 1 binário estático ~5–15 MB |

**Quando o Rust se justifica:** se a caixa precisa rodar outras coisas além da API, se você quer o menor footprint/superfície possível, ou pelo valor do binário autocontido (sem runtime Node, sem `node_modules`). O ganho de ~100 MB é relevante numa caixa de 512 MB, mas **não é o que decide se cabe** — quem decide é largar Mongo+Docker, e isso a spec SQLite-Node já entrega com muito menos risco.

**Premissa de dados:** base limpa (idêntica à spec irmã). Sem migração de dados. Hashes de senha são gerados do zero no boot, então **não há requisito de compatibilidade** com os hashes scrypt atuais.

## 3. Decisão central

1. **Novo crate `apps/api-rs/`** ao lado do `apps/api` (Node), permitindo migração incremental e validação de paridade antes do corte. O `apps/api` é aposentado ao final.
2. **Stack:** `axum` (HTTP, sobre Tokio) + `sqlx` (SQLite, async, migrations) + `jsonwebtoken` (JWT) + `serde`/`serde_json` (serialização e schema JSON-column).
3. **Paridade de contrato é requisito de aceite:** mesmos paths, métodos, payloads e status codes — o frontend **não muda**.
4. **Esquema por coluna JSON**, igual à spec SQLite-Node, para paridade conceitual entre as duas migrações.

## 4. Escopo

**Dentro do escopo:**

- Crate `apps/api-rs` replicando domínio, casos de uso, repositórios SQLite, camada HTTP e auth.
- Paridade de todos os endpoints listados em §6.
- Atualização do CI: cross-compile musl, cache de cargo, prerender com o binário Rust, deploy via SSH-push, `cargo test`.
- Unit systemd para o binário.
- Estratégia de corte (cutover) e rollback.

**Fora do escopo:**

- Mudanças no frontend e no prerender/SEO (apenas o endpoint que o prerender consome precisa responder igual).
- Migração de dados.
- Novas funcionalidades — é uma reescrita com paridade, não uma evolução.

## 5. Arquitetura (hexagonal em Rust)

Espelha a separação atual (domínio / aplicação / infraestrutura / http).

### 5.1 Crates e módulos

```
apps/api-rs/
├── Cargo.toml
└── src/
    ├── main.rs              # composition root: env, pool SQLite, seed, bootstrap admin, serve
    ├── config.rs            # leitura de env (equivalente a config/env.ts)
    ├── domain/              # entities + repository traits (Order, Product, User, AuditLog, RevokedToken)
    ├── application/         # use cases (create_order, login, change_password, list_products, ...)
    ├── infrastructure/      # sqlx repos, password hasher, transação
    └── http/                # axum router, handlers, extractor de auth admin, feeds, sitemap
```

### 5.2 Stack de bibliotecas (mapeamento a partir do Node)

| Função | Node atual | Rust |
|---|---|---|
| HTTP server | Fastify | `axum` + `tokio` |
| SQLite | (novo) | `sqlx` com feature `sqlite` |
| JWT | `@fastify/jwt` | `jsonwebtoken` |
| Hash de senha | `node:crypto` scrypt | `scrypt` (mantém formato `salt:hash`) ou `argon2` (recomendado, base limpa) |
| Validação | `zod` | `serde` + checagens explícitas (ou `validator`) |
| CORS / Helmet | `@fastify/cors` / `helmet` | `tower-http` (`CorsLayer`, headers) |
| Rate limit | `@fastify/rate-limit` | `tower_governor` (ou middleware próprio) |
| Serialização JSON-column | `JSON.stringify` | `serde_json` |

### 5.3 Persistência (sqlx + SQLite)

- Mesmo esquema de coluna JSON da spec SQLite-Node (tabelas `products`, `orders`, `users`, `audit_logs`, `revoked_tokens`; mesmos índices). Migrations geridas por `sqlx::migrate!`.
- Mesmos PRAGMAs (`WAL`, `synchronous=NORMAL`, `busy_timeout`).
- Mesma necessidade de limpeza de `revoked_tokens` (sem TTL nativo).

### 5.4 Transações

`create_order` (decrementa estoque + cria pedido) usa transação nativa do `sqlx`:

```rust
let mut tx = pool.begin().await?;
// validações + decrement_stock + insert order, usando &mut *tx
tx.commit().await?;
```

Sem o atrito sync/async do `better-sqlite3` — o caminho assíncrono é natural em Rust.

### 5.5 Auth e JWT

- JWT carrega os mesmos claims atuais: `sub` (user id), `role`, `tokenVersion`, `jti`, `exp`.
- Extractor `axum` que: valida assinatura/exp, confere `tokenVersion` contra o usuário atual e rejeita `jti` revogado (consulta `revoked_tokens`). Equivale ao `authenticateAdmin` atual.
- `logout`/`refresh`/troca de senha revogam o `jti` corrente e (na troca de senha) incrementam `tokenVersion`.

## 6. Mapa de paridade de contrato

Todos sob o prefixo `/api`. **Auth** = exige Bearer de admin. Os payloads e formatos de saída devem ser idênticos aos atuais.

| Método | Rota | Auth | Entrada | Saída / status |
|---|---|---|---|---|
| GET | `/health` | — | — | `{ status: "ok" }` |
| POST | `/login` | — | `{ login, password }` | `{ token }` · 401 · 400 · **rate-limit 5/min** |
| GET | `/me` | ✅ | — | `{ user: { id, role } }` |
| POST | `/refresh` | ✅ | — | revoga atual, emite novo `{ token }` |
| POST | `/logout` | ✅ | — | 204 (revoga `jti`) |
| PATCH | `/users/password` | ✅ | `{ currentPassword, newPassword }` | 204 · 400 · 401 (revoga + incrementa `tokenVersion`) |
| POST | `/orders` | — | order body + `lang` | 201 `{ order }` · 400 (`PRODUCT_NOT_FOUND`/`VARIANT_NOT_FOUND`/`INSUFFICIENT_STOCK` com `details`) |
| GET | `/orders` | ✅ | — | `{ orders }` |
| GET | `/orders/:id` | ✅ | — | `{ order }` · 404 |
| PATCH | `/orders/:id/status` | ✅ | `{ status }` | 204 · 404 · 400 |
| GET | `/products` | — | `?lang=&country=` | `{ products }` (ProductView; currency BRL se `country=BR`, senão USD; locale por `lang`) |
| GET | `/admin/products` | ✅ | — | `{ products }` (visão admin completa) |
| GET | `/admin/products/:id` | ✅ | — | `{ product }` · 404 |
| POST | `/products` | ✅ | product body | 201 `{ product }` · 400 |
| PUT | `/products/:id` | ✅ | product body | 200 `{ product }` · 404 · 400 |
| GET | `/feeds/google-shopping.xml` | — | `?lang=&country=` | RSS XML (`application/rss+xml`) |
| GET | `/feeds/products.tsv` | — | `?lang=&country=` | TSV (`text/tab-separated-values`) |
| GET | `/feeds/meta-catalog.csv` | — | `?lang=&country=` | CSV (`text/csv`) |
| GET | `/sitemap.xml` | — | — | XML com `hreflang` (pt/en/es/zh/ja + x-default), `cache-control: public, max-age=3600` |

Os geradores de feed (`google-shopping.xml`, `products.tsv`, `meta-catalog.csv`) e o `sitemap.xml` têm lógica de formatação não trivial (escape XML/CSV, colunas do catálogo, alternates de idioma) — ver `apps/api/src/http/catalog-feed.ts` e `sitemap-feed.ts` como referência exata a replicar, com testes de snapshot garantindo bytes equivalentes.

## 7. CI/CD atualizado

Estrutura atual: build no `ubuntu-latest`, deploy em runners self-hosted (`archlinux`, `ec2-t3-nano`). Mudanças:

### 7.1 Build — cross-compile musl

- Compilar no `ubuntu-latest` para `x86_64-unknown-linux-musl` → **binário estático** (~5–15 MB), roda em qualquer distro sem dependências de libc.
- Cache de cargo via `Swatinem/rust-cache`.
- **⚠️ Nunca compilar Rust na `t3.nano`** — a compilação consome bem mais que 512 MB. Cross-compila na nuvem; a caixa só recebe o binário.

### 7.2 Prerender com o binário Rust

- O passo de prerender (frontend consome `/api/products`) passa a subir o **binário Rust** com um SQLite efêmero seedado, esperar `/api/health`, buildar o frontend e encerrar — substitui `docker compose up mongodb api`.

### 7.3 Deploy via SSH-push

- Igual à spec SQLite-Node (§8.2/§8.3 lá): runner GitHub-hosted conecta por SSH e:
  1. `rsync` do `dist-front`.
  2. `rsync`/`scp` do binário para `/opt/arateki/bin/arateki-api`.
  3. `systemctl restart arateki-api`.
- Mesmo modelo de segurança de menor privilégio (chave dedicada, usuário `deploy` não-root, sudoers restrito ao restart, `sshd` endurecido). Remove os passos `docker build`/`save`/`load`.

### 7.4 Testes

- `cargo test` (unit + integração com SQLite `:memory:`) substitui o `vitest` da API no CI.
- Frontend mantém `vitest` + `playwright`.
- Recomendado: testes de contrato comparando respostas do binário Rust com as respostas do Node atual durante o período de paralelo (§9).

### 7.5 Diff do workflow (antes → depois)

| Passo atual (`main.yml`) | Vira |
|---|---|
| `Build API` (`pnpm --filter api build`) | `cargo build --release --target x86_64-unknown-linux-musl` |
| `Build API Docker image` / `Save`/`Load` | **removido** (deploy é o binário) |
| `Start API for Prerender` (`docker compose up mongodb api`) | sobe o binário Rust com `.db` efêmero |
| `Deploy API and Database` (`docker compose up`) | `rsync` binário + `systemctl restart` por SSH |
| Runner residente na `t3.nano` | **removido** (deploy SSH-push) |

## 8. Deploy bare-metal (systemd)

```ini
[Service]
User=arateki
ExecStart=/opt/arateki/bin/arateki-api
EnvironmentFile=/etc/arateki/api.env
Restart=on-failure
# NoNewPrivileges, ProtectSystem=strict, ReadWritePaths=/var/lib/arateki
```

Mesmas variáveis de ambiente da spec irmã (`SQLITE_PATH`, `JWT_SECRET`, `ADMIN_*`, `CORS_ORIGIN`, `PUBLIC_SITE_URL`, `PORT`, `HOST`). Frontend continua servido por nginx a partir de `/var/www/arateki/dist-front`, com `/api/*` em proxy para `127.0.0.1:3333`.

## 9. Estratégia de migração incremental

1. **Fundação** — crate `apps/api-rs`, config, pool SQLite, schema/migrations, seed + bootstrap admin, `/health`.
2. **Domínio + leitura pública** — produtos (`/products`), feeds e sitemap (com testes de snapshot contra o Node).
3. **Auth + admin** — login/me/refresh/logout/troca de senha, rotas admin de produto.
4. **Pedidos** — `create_order` transacional, listagem/consulta/atualização de status.
5. **Paralelo e validação** — rodar o binário Rust ao lado do Node, comparar respostas (testes de contrato) para todos os endpoints de §6.
6. **Cutover** — apontar o CI/deploy para o binário Rust; aposentar `apps/api`.

**Rollback:** enquanto o `apps/api` (Node) existir e o CI souber buildá-lo, o corte é reversível trocando o alvo de deploy de volta para o bundle Node. Recomenda-se manter o Node por ao menos um ciclo após o cutover.

## 10. Riscos

| Risco | Mitigação |
|---|---|
| Esforço alto (rewrite, 1–3 semanas) | Migração incremental por fatias verificáveis (§9); só vale se o ganho de footprint for desejado |
| Divergência de contrato com o frontend | Tabela de paridade (§6) + testes de contrato no período de paralelo |
| Feeds/sitemap com formatação sutil (escape, colunas, hreflang) | Testes de snapshot byte-a-byte contra a saída do Node |
| Equivalência de bibliotecas (rate-limit, helmet) | `tower-http`/`tower_governor`; validar headers e limites equivalentes |
| Compilação Rust pesada na caixa | Cross-compile no CI; a `t3.nano` nunca compila |

## 11. Critérios de aceite

- Todos os endpoints de §6 respondem com paridade de path/payload/status, validada por testes de contrato contra o Node.
- Feeds e sitemap idênticos byte-a-byte (snapshots).
- `cargo test` verde no CI; binário musl estático produzido e versionado como artefato.
- Frontend prerenderiza no CI consumindo o binário Rust.
- Deploy ponta-a-ponta por SSH-push; sem runner residente na `t3.nano`; sem Docker no caminho de produção.
- API em regime estável dentro do orçamento (ver apêndice).

## Apêndice — footprint estimado (`t3.nano`, 512 MB)

| Componente | RAM |
|---|---|
| SO | ~200 MB |
| nginx (estático) | 10–15 MB |
| API Rust (axum + sqlx) | 10–25 MB |
| SQLite (in-process) | desprezível |
| **Total** | **~230 MB** ✅ folga ampla |
