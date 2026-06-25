# Arateki — SPEC: API em SQLite + deploy bare-metal (Docker opcional)

- **Status:** Proposta (design aprovado, aguardando plano de implementação)
- **Data:** 2026-06-24
- **Alvo de deploy:** AWS EC2 `t3.nano` (512 MB RAM, ~300 MB livres)
- **Documento irmão:** [`RUST-MIGRATION-SPEC.md`](./RUST-MIGRATION-SPEC.md)

---

## 1. Objetivo

Permitir que a API rode confortavelmente em uma `t3.nano` (512 MB) **sem MongoDB e sem Docker obrigatório**, trocando o armazenamento por **SQLite embutido** e subindo o processo Node direto via **systemd**. O Docker continua suportado, porém **opcional**, para ambientes folgados (ex.: o home-server `archlinux`).

Não é objetivo reescrever a API nem mudar a stack de linguagem — isso é tratado na spec irmã (Rust). Aqui o ganho vem de **remover o MongoDB** (o maior consumidor de RAM) e **remover a obrigatoriedade do Docker**.

## 2. Contexto e motivação

A stack atual na `t3.nano` empilha três consumidores de RAM que, somados, estouram os 512 MB:

| Componente | RAM residente realista |
|---|---|
| MongoDB 7 (cache WiredTiger mínimo 256 MB + processo) | 0,5–1 GB ⛔ |
| Self-hosted runner do GitHub Actions (residente 24/7) | ~100 MB |
| API Node em Docker (daemon + container) | ~150–230 MB |

O MongoDB sozinho já não cabe. SQLite é **in-process** (zero processo separado, footprint desprezível), o que elimina o vilão. Removendo Docker e o runner residente (ver §8), a caixa passa a rodar apenas `nginx` + processo Node + arquivo `.db`.

**Premissa de dados (decisão do projeto):** a migração parte de **base limpa** — não há export/import de dados do Mongo. Produtos e admin são recriados no boot (`seedIfEmpty` + `BootstrapAdminUseCase`). Pedidos, audit logs e revoked tokens existentes (se houver) **não** são preservados.

## 3. Decisão central

1. **SQLite passa a ser o banco** da API. O domínio fica 100% agnóstico de banco (hoje há dois vazamentos do MongoDB que serão removidos — ver §5.4).
2. **A mesma API-SQLite sobe de dois jeitos**, selecionáveis pelo operador:
   - **Bare-metal / systemd** — modo leve, principal, o que cabe na `t3.nano`.
   - **Docker** — opcional, container único rodando a API com o `.db` em volume (sem container Mongo). Para ambientes folgados.
3. **Esquema por coluna JSON** (não relacional normalizado): cada agregado é persistido como documento JSON, espelhando 1:1 os documentos Mongo atuais.

## 4. Escopo

**Dentro do escopo:**

- Implementações SQLite dos 5 repositórios (`order`, `product`, `user`, `audit-log`, `revoked-token`).
- Conexão/bootstrap SQLite (criação de schema no boot, PRAGMAs).
- Remoção dos vazamentos de MongoDB no domínio/aplicação via port de transação neutro.
- Ajuste do composition root (`main.ts`) e de `config/env.ts`.
- Migração da suíte de testes da API de `mongodb-memory-server` para SQLite `:memory:`.
- Unit systemd + configuração nginx + procedimento de backup.
- Ajuste do CI: prerender com API-SQLite e deploy via SSH-push (substituindo `docker compose up` no destino).
- Manter Dockerfile/compose como caminho **opcional** (sem Mongo).

**Fora do escopo:**

- Migração de dados de produção (decisão: base limpa).
- Reescrita em outra linguagem (ver spec Rust).
- Mudanças no frontend e na sua estratégia de prerender/SEO.
- Manter MongoDB como driver selecionável (Mongo é aposentado; ver §10 se for reconsiderado).

## 5. Arquitetura

A arquitetura hexagonal atual já isola o banco em `infrastructure/`. A mudança é majoritariamente **aditiva** nessa camada, com duas correções cirúrgicas no domínio/aplicação.

### 5.1 Camada de persistência (SQLite)

- Novo diretório `apps/api/src/infrastructure/sqlite/`:
  - `sqlite.ts` — abre a conexão (`better-sqlite3`), aplica PRAGMAs, cria o schema (`CREATE TABLE IF NOT EXISTS`) e expõe o handle + um `TransactionRunner`.
  - `sqlite-order-repository.ts`, `sqlite-product-repository.ts`, `sqlite-user-repository.ts`, `sqlite-audit-log-repository.ts`, `sqlite-revoked-token-repository.ts` — implementam as **mesmas interfaces** já definidas em `domain/*` (`OrderRepository`, `ProductRepository`, etc.).
- **Driver:** `better-sqlite3` (síncrono, maduro, prebuilds para Linux x64 — compatível com a `t3.nano`). Alternativa registrada: `node:sqlite` (nativo do Node 24, ainda experimental) — preterida pela maturidade.
- As interfaces de repositório permanecem `async` (retornando `Promise.resolve(...)` sobre chamadas síncronas), de forma que **os use-cases não mudam** (exceto o de transação, §5.4).

### 5.2 Schema (coluna JSON)

Cada coleção Mongo vira uma tabela `(<id>, doc, <colunas extraídas para índice>)`. O `doc` guarda o agregado serializado (`JSON.stringify` do objeto de domínio), preservando estruturas aninhadas (`product.name` multilíngue, `variants[]`, `order.items[]`, `prices` multi-moeda) sem achatamento.

```
products        (id TEXT PK, doc TEXT, active INTEGER, updated_at TEXT)
orders          (id TEXT PK, doc TEXT, status TEXT, contact_email TEXT, created_at TEXT)
users           (id TEXT PK, doc TEXT, login TEXT UNIQUE)
audit_logs      (id TEXT PK, doc TEXT, created_at TEXT)
revoked_tokens  (jti TEXT PK, expires_at TEXT)
```

Índices (espelham os `ensureIndexes` atuais):

```
idx_orders_status_created   ON orders (status, created_at DESC)
idx_orders_email_created    ON orders (contact_email, created_at DESC)
idx_products_active         ON products (active)
idx_audit_created           ON audit_logs (created_at DESC)
idx_revoked_expires         ON revoked_tokens (expires_at)
```

Leituras por id usam a PK; listagens e filtros usam as colunas extraídas; campos internos raros podem usar `json_extract(doc, '$.campo')`. Datas são gravadas em ISO-8601 (`TEXT`) para ordenação lexicográfica correta.

### 5.3 Conexão e PRAGMAs

No boot, aplicar:

```
PRAGMA journal_mode = WAL;      -- leituras concorrem com a escrita
PRAGMA synchronous = NORMAL;    -- equilíbrio durabilidade/velocidade sob WAL
PRAGMA busy_timeout = 5000;     -- evita SQLITE_BUSY sob concorrência
PRAGMA foreign_keys = ON;
```

WAL é importante porque a API tem leituras frequentes (catálogo, prerender) e escritas pontuais (pedidos). SQLite é **single-writer**, o que para o volume desta loja é mais do que suficiente.

### 5.4 Port de transação (remoção dos vazamentos de MongoDB)

Hoje o MongoDB vaza para fora de `infrastructure/` em dois pontos, ambos ligados à transação de criação de pedido:

- `domain/order.ts` importa `ClientSession` e o expõe na assinatura de `OrderRepository`.
- `application/create-order.ts` depende de `MongoClient` e usa `session.withTransaction(...)` para tornar atômico o "decrementa estoque + cria pedido".

**Solução:** introduzir um port neutro no domínio:

```ts
export interface TransactionRunner {
  run<T>(work: () => Promise<T>): Promise<T>;
}
```

- `CreateOrderUseCase` passa a depender de `TransactionRunner` em vez de `MongoClient`.
- As assinaturas de repositório perdem o parâmetro `session?: ClientSession`.
- Implementação SQLite: `run()` executa `BEGIN IMMEDIATE` → `work()` → `COMMIT` (ou `ROLLBACK` em erro). Como `better-sqlite3` é síncrono e single-connection, as operações de repositório dentro de `work()` são naturalmente atômicas.

> **⚠️ Restrição documentada:** o corpo passado a `run()` só pode tocar repositórios SQLite — nenhuma chamada de rede/FS assíncrona externa dentro da transação. Com `BEGIN IMMEDIATE` + `busy_timeout`, isso é seguro para o caso de uso (apenas `create-order`). Alternativa de robustez máxima (caminho `create-order` totalmente síncrono via `db.transaction()`) fica registrada para o plano de implementação caso se queira eliminar o risco teórico de intercalação.

### 5.5 Composition root e configuração

- `config/env.ts`: substituir `mongodbUri` por `sqlitePath` (`SQLITE_PATH`, default `/var/lib/arateki/arateki.db`; `:memory:` em testes).
- `main.ts`: instanciar a conexão SQLite e os repositórios SQLite; `seedIfEmpty`, `ensureIndexes` (agora "ensure schema") e `BootstrapAdminUseCase` permanecem.
- Remover a dependência `mongodb` do `package.json` da API (e `mongodb-memory-server` dos devDeps).

### 5.6 Testes

- Substituir `mongodb-memory-server` por SQLite `:memory:` em `src/test/test-app.ts` e nos `*.test.ts`. Cada teste abre um banco em memória isolado — mais rápido e mais leve que subir um `mongod` efêmero.
- Os testes de caso de uso e de rota não mudam de intenção; só a fábrica de repositórios muda.

## 6. Deploy bare-metal (modo leve, principal)

### 6.1 Topologia

```
Internet ──▶ nginx ──┬─▶ /            arquivos estáticos em /var/www/arateki/dist-front
                     └─▶ /api/*       proxy_pass http://127.0.0.1:3333  (systemd: arateki-api)
                                       arateki-api ──▶ SQLite /var/lib/arateki/arateki.db
```

### 6.2 systemd unit (`arateki-api.service`)

Esboço (detalhe final no plano de implementação):

```ini
[Service]
User=arateki
WorkingDirectory=/opt/arateki/api
ExecStart=/usr/bin/node dist/main.js
EnvironmentFile=/etc/arateki/api.env
Restart=on-failure
# hardening: NoNewPrivileges, ProtectSystem=strict, ReadWritePaths=/var/lib/arateki
```

- Node 24 instalado na máquina (runtime). O `dist/` + `node_modules` de produção são enviados pelo CI.
- **Atenção `better-sqlite3` (módulo nativo):** o prebuild precisa casar com a versão de Node/arquitetura da máquina. Como o build do CI roda em `ubuntu-latest` x64 e a `t3.nano` é Linux x64, o prebuild é compatível; o plano valida isso (ou executa `npm rebuild` no destino).

### 6.3 nginx

`server` servindo `dist-front` com fallback SPA e `location /api/ { proxy_pass http://127.0.0.1:3333; }`. Mantém a entrega estática do frontend que já existe hoje.

### 6.4 Variáveis de ambiente (`/etc/arateki/api.env`)

`NODE_ENV=production`, `PORT=3333`, `HOST=127.0.0.1`, `SQLITE_PATH=/var/lib/arateki/arateki.db`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `ADMIN_LOGIN`, `ADMIN_PASSWORD`, `CORS_ORIGIN`, `PUBLIC_SITE_URL`. Arquivo com permissão `0600`, dono `arateki`.

## 7. Deploy Docker (opcional)

- `apps/api/Dockerfile` passa a empacotar **apenas** a API-SQLite (sem estágio/healthcheck de Mongo).
- `docker-compose.yml` simplificado: serviço único `api` + volume nomeado para `/var/lib/arateki`. Indicado para o home-server `archlinux`, não para a `t3.nano`.

## 8. CI/CD (ajustes)

O build permanece no runner **GitHub-hosted** (`ubuntu-latest`). Mudanças:

### 8.1 Build e prerender

- O passo de prerender (que consome `/api/products`) deixa de subir `docker compose up mongodb api` e passa a subir a **API-SQLite** com um `.db` efêmero seedado, esperar `/api/health`, buildar o frontend e encerrar. Mais leve e rápido.
- Some o passo de `docker build`/`docker save` da imagem da API (no modo bare-metal). O artefato publicado passa a ser `dist/` + `node_modules` de produção da API (tar) + `dist-front` do frontend.

### 8.2 Deploy via SSH-push (sem runner residente)

- Eliminar o runner self-hosted residente na `t3.nano`. O job de deploy roda no runner GitHub-hosted e **conecta por SSH** na máquina:
  1. `rsync` do `dist-front` para `/var/www/arateki/dist-front`.
  2. `rsync` do bundle da API para `/opt/arateki/api`.
  3. `systemctl restart arateki-api` (via sudoers restrito).
- O home-server `archlinux` pode permanecer com runner self-hosted (decisão independente).

### 8.3 Segurança do deploy SSH-push

Modelo de menor privilégio (equivalente ou superior em segurança ao runner residente, e sem o custo de RAM dele):

- **Chave dedicada** ed25519 exclusiva do deploy, guardada em GitHub Secrets, revogável isoladamente.
- **Usuário `deploy` não-root**, dono apenas dos diretórios de release.
- **Restart via `sudoers`** restrito a um único comando: `systemctl restart arateki-api`.
- **`authorized_keys` travado:** `no-port-forwarding,no-agent-forwarding,no-pty` (+ opcional `from="<faixas de IP do GitHub Actions>"`).
- **`sshd` endurecido:** `PasswordAuthentication no`, `PermitRootLogin no`.
- **Security group:** porta 22 restrita às faixas de IP do GitHub Actions (`https://api.github.com/meta` → `actions`) quando se quiser fechar mais.
- **Alternativa de "porta zero exposta":** AWS SSM Session Manager (deploy só por conexão de saída, sem abrir a 22) — preterida por adicionar um agente residente (RAM) e setup IAM; registrada caso a exposição de SSH seja inaceitável.

## 9. Backup e operação

- Banco = 1 arquivo. Backup consistente com `sqlite3 arateki.db ".backup '/var/backups/arateki-$(date +%F).db'"` (respeita WAL). Cron diário opcional + retenção.
- Restauração = parar o serviço, substituir o arquivo, reiniciar.
- **Limpeza de `revoked_tokens`:** SQLite não tem TTL automático (o Mongo tinha índice TTL). Incluir limpeza de tokens expirados — no boot e/ou em job periódico (`DELETE FROM revoked_tokens WHERE expires_at < now`).

## 10. Riscos e pontos de atenção

| Risco | Mitigação |
|---|---|
| Conflito sync/async na transação (`better-sqlite3` síncrono vs use-case async) | Port com `BEGIN IMMEDIATE` + `busy_timeout`; restrição documentada (§5.4); alternativa síncrona registrada |
| Módulo nativo `better-sqlite3` incompatível no destino | Build e runtime ambos Linux x64; validar prebuild ou `npm rebuild` no deploy |
| `revoked_tokens` sem TTL | Limpeza no boot + job periódico (§9) |
| Concorrência de escrita (single-writer) | WAL + `busy_timeout`; volume da loja é baixo |
| Reintroduzir MongoDB no futuro | Interfaces de domínio preservadas; bastaria um driver alternativo atrás de `DB_DRIVER` |

## 11. Fases de implementação (alto nível)

1. **Persistência SQLite** — conexão + schema + 5 repositórios + testes `:memory:`.
2. **Port de transação** — remover vazamentos Mongo, ajustar `create-order` e `main.ts`/`env.ts`; remover deps Mongo.
3. **Empacotamento** — systemd unit, nginx, env, Dockerfile/compose opcional simplificado, script de backup + limpeza de tokens.
4. **CI/CD** — prerender com API-SQLite, deploy via SSH-push endurecido, remoção do runner residente da `t3.nano`.

(O detalhamento tarefa-a-tarefa será produzido na fase de plano de implementação.)

## 12. Critérios de aceite

- `pnpm --filter @arateki/api test` verde usando SQLite `:memory:`, sem `mongodb`/`mongodb-memory-server` nas dependências.
- API sobe na `t3.nano` via systemd, responde `/api/health` e serve `/api/products` com produtos seedados.
- Criação de pedido decrementa estoque atomicamente (validado por teste de concorrência/falha).
- Frontend prerenderiza no CI consumindo a API-SQLite.
- Deploy ponta-a-ponta por SSH-push, sem runner residente na `t3.nano`.
- Uso de RAM em regime estável dentro do orçamento (ver apêndice).

## Apêndice — footprint estimado (`t3.nano`, 512 MB)

| Componente | RAM |
|---|---|
| SO | ~200 MB |
| nginx (estático) | 10–15 MB |
| API Node/Fastify | 80–130 MB |
| SQLite (in-process) | desprezível |
| **Total** | **~300–345 MB** ✅ cabe com folga |
