# Plano de Implementação — API em SQLite + deploy bare-metal

> **For agentic workers:** REQUIRED SUB-SKILL: use `superpowers:subagent-driven-development` (recomendado) ou `superpowers:executing-plans` para implementar este plano tarefa-a-tarefa. Os passos usam checkbox (`- [ ]`) para rastreio.

**Goal:** Migrar a API (`apps/api`) de MongoDB para SQLite embutido e habilitar deploy bare-metal (systemd) na `t3.nano`, mantendo Docker como caminho opcional, sem alterar o contrato HTTP.

**Architecture:** A arquitetura hexagonal já isola persistência em `infrastructure/`. Adicionamos repositórios SQLite (esquema por coluna JSON, espelhando os documentos Mongo), um port de transação neutro que remove os vazamentos de MongoDB do domínio, e trocamos o wiring no `main.ts`/`test-app.ts`. Os Mongo repos são removidos ao final.

**Tech Stack:** TypeScript (strict, sem `any`), Fastify 5, `better-sqlite3` (driver síncrono embutido), Vitest. Node 24.

**Spec de referência:** [`SQLITE-BAREMETAL-SPEC.md`](./SQLITE-BAREMETAL-SPEC.md)

## Global Constraints

- TypeScript **strict, proibido `any`** — usar tipos ou `unknown` + cast explícito (CLAUDE.md).
- Imports ESM com extensão `.js` (NodeNext) — ex.: `'../domain/order.js'`.
- **Não alterar o contrato HTTP** — paths, payloads e status codes permanecem idênticos.
- Datas são `Date` nos tipos de domínio. Ao persistir em coluna JSON, `JSON.stringify` serializa para ISO-8601; ao ler, **reidratar** os campos de data para `Date` (senão `.toISOString()` quebra).
- Premissa de dados: **base limpa** — sem migração de dados do Mongo.
- Todo agregado é persistido como `doc` JSON + colunas extraídas só para índice.
- Após cada task, a suíte da task deve passar; ao final da Task 8 a suíte **inteira** (`pnpm --filter @arateki/api test`) deve passar e `pnpm --filter @arateki/api build` compilar.

---

### Task 1: Driver, conexão e schema SQLite

**Files:**
- Modify: `apps/api/package.json` (adicionar `better-sqlite3` + `@types/better-sqlite3`)
- Create: `apps/api/src/infrastructure/sqlite/schema.ts`
- Create: `apps/api/src/infrastructure/sqlite/sqlite.ts`
- Create: `apps/api/src/infrastructure/sqlite/sqlite.test.ts`

**Interfaces:**
- Produces: `openDatabase(path: string): SqliteConnection` onde `interface SqliteConnection { db: Database.Database; close(): void }`. Reutilizado por todos os repositórios e pelo wiring.

- [ ] **Step 1: Instalar o driver**

Run: `pnpm --filter @arateki/api add better-sqlite3 && pnpm --filter @arateki/api add -D @types/better-sqlite3`
Expected: ambos aparecem em `apps/api/package.json`.

- [ ] **Step 2: Escrever o schema**

Create `apps/api/src/infrastructure/sqlite/schema.ts`:

```ts
export const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  doc TEXT NOT NULL,
  active INTEGER NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_products_active ON products (active);

CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  doc TEXT NOT NULL,
  status TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_orders_status_created ON orders (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_email_created ON orders (contact_email, created_at DESC);

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  doc TEXT NOT NULL,
  login TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  doc TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs (created_at DESC);

CREATE TABLE IF NOT EXISTS revoked_tokens (
  jti TEXT PRIMARY KEY,
  expires_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_revoked_expires ON revoked_tokens (expires_at);
`;
```

- [ ] **Step 3: Escrever o teste falho**

Create `apps/api/src/infrastructure/sqlite/sqlite.test.ts`:

```ts
import { openDatabase } from './sqlite.js';

it('creates all tables and applies WAL', () => {
  const { db, close } = openDatabase(':memory:');
  const tables = db
    .prepare(`SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name`)
    .all() as Array<{ name: string }>;
  const names = tables.map(t => t.name);

  expect(names).toEqual(
    expect.arrayContaining(['products', 'orders', 'users', 'audit_logs', 'revoked_tokens']),
  );
  expect(db.pragma('busy_timeout', { simple: true })).toBe(5000);
  close();
});
```

- [ ] **Step 4: Rodar o teste e confirmar a falha**

Run: `pnpm --filter @arateki/api exec vitest run src/infrastructure/sqlite/sqlite.test.ts`
Expected: FAIL — `Cannot find module './sqlite.js'`.

- [ ] **Step 5: Implementar a conexão**

Create `apps/api/src/infrastructure/sqlite/sqlite.ts`:

```ts
import Database from 'better-sqlite3';
import { SCHEMA_SQL } from './schema.js';

export interface SqliteConnection {
  db: Database.Database;
  close(): void;
}

export function openDatabase(path: string): SqliteConnection {
  const db = new Database(path);
  db.pragma('journal_mode = WAL');
  db.pragma('synchronous = NORMAL');
  db.pragma('busy_timeout = 5000');
  db.pragma('foreign_keys = ON');
  db.exec(SCHEMA_SQL);
  return { db, close: () => db.close() };
}
```

- [ ] **Step 6: Rodar o teste e confirmar sucesso**

Run: `pnpm --filter @arateki/api exec vitest run src/infrastructure/sqlite/sqlite.test.ts`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add apps/api/package.json apps/api/pnpm-lock.yaml apps/api/src/infrastructure/sqlite/
git commit -m "feat(api): add SQLite connection and schema"
```

---

### Task 2: SqliteProductRepository

**Files:**
- Create: `apps/api/src/infrastructure/sqlite/sqlite-product-repository.ts`
- Create: `apps/api/src/infrastructure/sqlite/sqlite-product-repository.test.ts`

**Interfaces:**
- Consumes: `openDatabase` (Task 1); `Product`, `ProductInput`, `ProductRepository` de `domain/product.js`.
- Produces: `class SqliteProductRepository implements ProductRepository` (assinaturas **sem** o parâmetro `session` — ver Task 7). `decrementStock` lança `Error('INSUFFICIENT_STOCK_OR_NOT_FOUND')` quando estoque é insuficiente ou produto/variante não existe.

> Nota: a interface `ProductRepository` ainda declara `session?: ClientSession` neste ponto; implementar **sem** esse parâmetro causa erro de tipo. Para manter a Task isolada, declarar os métodos com a assinatura final (sem `session`) e marcar a Task 7 como quem remove o parâmetro da interface. Se o `pnpm build` for exigido aqui, rode apenas o teste desta Task com vitest (que usa `isolatedModules` e não checa a interface inteira). O build global só é exigido na Task 8.

- [ ] **Step 1: Escrever os testes falhos**

Create `apps/api/src/infrastructure/sqlite/sqlite-product-repository.test.ts`:

```ts
import { openDatabase, type SqliteConnection } from './sqlite.js';
import { SqliteProductRepository } from './sqlite-product-repository.js';
import type { ProductInput } from '../../domain/product.js';

function makeInput(overrides: Partial<ProductInput> = {}): ProductInput {
  return {
    name: { pt: 'Sensor', en: 'Sensor', es: 'Sensor', zh: '传感器', ja: 'センサー' },
    description: { pt: 'd', en: 'd', es: 'd', zh: 'd', ja: 'd' },
    variants: [{ sku: 'SKU-1', attributes: { color: 'black' }, prices: { brlCents: 1000, usdCents: 200 }, stock: 5 }],
    ...overrides,
  };
}

let conn: SqliteConnection;
let repo: SqliteProductRepository;

beforeEach(() => {
  conn = openDatabase(':memory:');
  repo = new SqliteProductRepository(conn.db);
});
afterEach(() => conn.close());

it('creates and reads back a product with Date instances', async () => {
  const created = await repo.create(makeInput());
  const found = await repo.findById(created.id);

  expect(found?.id).toBe(created.id);
  expect(found?.createdAt).toBeInstanceOf(Date);
  expect(found?.variants[0]?.id).toBeTruthy();
});

it('listActive omits inactive products', async () => {
  await repo.create(makeInput());
  await repo.create(makeInput({ active: false }));
  const active = await repo.listActive();
  expect(active).toHaveLength(1);
});

it('decrementStock reduces stock atomically', async () => {
  const p = await repo.create(makeInput());
  await repo.decrementStock(p.id, p.variants[0]!.id, 2);
  const found = await repo.findById(p.id);
  expect(found?.variants[0]?.stock).toBe(3);
});

it('decrementStock throws when insufficient', async () => {
  const p = await repo.create(makeInput());
  await expect(repo.decrementStock(p.id, p.variants[0]!.id, 99)).rejects.toThrow('INSUFFICIENT_STOCK_OR_NOT_FOUND');
});

it('seedIfEmpty is idempotent', async () => {
  const seed = await repo.create(makeInput());
  await repo.seedIfEmpty([{ ...seed, id: 'seed-2' }]);
  expect(await repo.listAll()).toHaveLength(1);
});
```

- [ ] **Step 2: Rodar e confirmar falha**

Run: `pnpm --filter @arateki/api exec vitest run src/infrastructure/sqlite/sqlite-product-repository.test.ts`
Expected: FAIL — módulo não encontrado.

- [ ] **Step 3: Implementar o repositório**

Create `apps/api/src/infrastructure/sqlite/sqlite-product-repository.ts`:

```ts
import { randomUUID } from 'node:crypto';
import type Database from 'better-sqlite3';
import type { Product, ProductInput, ProductRepository } from '../../domain/product.js';

interface ProductRow { doc: string }

export class SqliteProductRepository implements ProductRepository {
  constructor(private readonly db: Database.Database) {}

  async listActive(): Promise<Product[]> {
    const rows = this.db
      .prepare(`SELECT doc FROM products WHERE active = 1 ORDER BY json_extract(doc, '$.name.en') ASC`)
      .all() as ProductRow[];
    return rows.map(rowToProduct);
  }

  async listAll(): Promise<Product[]> {
    const rows = this.db
      .prepare(`SELECT doc FROM products ORDER BY json_extract(doc, '$.name.en') ASC`)
      .all() as ProductRow[];
    return rows.map(rowToProduct);
  }

  async findById(id: string): Promise<Product | null> {
    const row = this.db.prepare(`SELECT doc FROM products WHERE id = ?`).get(id) as ProductRow | undefined;
    return row ? rowToProduct(row) : null;
  }

  async findActiveById(id: string): Promise<Product | null> {
    const row = this.db.prepare(`SELECT doc FROM products WHERE id = ? AND active = 1`).get(id) as ProductRow | undefined;
    return row ? rowToProduct(row) : null;
  }

  async create(input: ProductInput): Promise<Product> {
    const now = new Date();
    const product: Product = {
      id: randomUUID(),
      name: input.name,
      description: input.description,
      imageUrl: input.imageUrl,
      variants: input.variants.map(variant => ({
        id: variant.id || randomUUID(),
        sku: variant.sku,
        attributes: variant.attributes,
        prices: variant.prices,
        stock: variant.stock,
        active: variant.active ?? true,
      })),
      active: input.active ?? true,
      createdAt: now,
      updatedAt: now,
    };
    this.insert(product);
    return product;
  }

  async update(id: string, input: ProductInput): Promise<Product | null> {
    const existing = await this.findById(id);
    if (!existing) return null;
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
      updatedAt: new Date(),
    };
    this.db
      .prepare(`UPDATE products SET doc = ?, active = ?, updated_at = ? WHERE id = ?`)
      .run(JSON.stringify(product), product.active ? 1 : 0, product.updatedAt.toISOString(), id);
    return product;
  }

  async seedIfEmpty(products: Product[]): Promise<void> {
    const count = (this.db.prepare(`SELECT COUNT(*) AS n FROM products`).get() as { n: number }).n;
    if (count > 0) return;
    const insertMany = this.db.transaction((items: Product[]) => {
      for (const item of items) this.insert(item);
    });
    insertMany(products);
  }

  async decrementStock(productId: string, variantId: string, quantity: number): Promise<void> {
    const row = this.db.prepare(`SELECT doc FROM products WHERE id = ?`).get(productId) as ProductRow | undefined;
    if (!row) throw new Error('INSUFFICIENT_STOCK_OR_NOT_FOUND');
    const product = rowToProduct(row);
    const variant = product.variants.find(item => item.id === variantId);
    if (!variant || variant.stock < quantity) throw new Error('INSUFFICIENT_STOCK_OR_NOT_FOUND');
    variant.stock -= quantity;
    product.updatedAt = new Date();
    this.db
      .prepare(`UPDATE products SET doc = ?, updated_at = ? WHERE id = ?`)
      .run(JSON.stringify(product), product.updatedAt.toISOString(), productId);
  }

  private insert(product: Product): void {
    this.db
      .prepare(`INSERT INTO products (id, doc, active, updated_at) VALUES (?, ?, ?, ?)`)
      .run(product.id, JSON.stringify(product), product.active ? 1 : 0, product.updatedAt.toISOString());
  }
}

function rowToProduct(row: ProductRow): Product {
  const parsed = JSON.parse(row.doc) as Product;
  return { ...parsed, createdAt: new Date(parsed.createdAt), updatedAt: new Date(parsed.updatedAt) };
}
```

- [ ] **Step 4: Rodar e confirmar sucesso**

Run: `pnpm --filter @arateki/api exec vitest run src/infrastructure/sqlite/sqlite-product-repository.test.ts`
Expected: PASS (5 testes).

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/infrastructure/sqlite/sqlite-product-repository.ts apps/api/src/infrastructure/sqlite/sqlite-product-repository.test.ts
git commit -m "feat(api): add SqliteProductRepository"
```

---

### Task 3: SqliteOrderRepository

**Files:**
- Create: `apps/api/src/infrastructure/sqlite/sqlite-order-repository.ts`
- Create: `apps/api/src/infrastructure/sqlite/sqlite-order-repository.test.ts`

**Interfaces:**
- Consumes: `Order`, `OrderRepository`, `OrderStatus` de `domain/order.js`.
- Produces: `class SqliteOrderRepository implements OrderRepository` (`create` **sem** parâmetro `session`). `updateStatus` retorna `true` se o pedido existia.

- [ ] **Step 1: Escrever os testes falhos**

Create `apps/api/src/infrastructure/sqlite/sqlite-order-repository.test.ts`:

```ts
import { openDatabase, type SqliteConnection } from './sqlite.js';
import { SqliteOrderRepository } from './sqlite-order-repository.js';
import type { Order } from '../../domain/order.js';

function makeOrder(id: string, createdAt: Date): Order {
  return {
    id,
    status: 'pending',
    contact: { name: 'Yan', email: 'y@a.com', phone: '1' },
    address: { country: 'BR', postalCode: '1', state: 'SP', city: 'SP', line1: 'x' },
    items: [{ productId: 'p', variantId: 'v', sku: 's', name: 'n', quantity: 1, unitPriceCents: 100, subtotalCents: 100 }],
    currency: 'BRL',
    totalCents: 100,
    createdAt,
    updatedAt: createdAt,
  };
}

let conn: SqliteConnection;
let repo: SqliteOrderRepository;
beforeEach(() => { conn = openDatabase(':memory:'); repo = new SqliteOrderRepository(conn.db); });
afterEach(() => conn.close());

it('persists and reads an order with Date instances', async () => {
  const order = makeOrder('o1', new Date('2026-01-01T00:00:00.000Z'));
  await repo.create(order);
  const found = await repo.findById('o1');
  expect(found?.createdAt).toBeInstanceOf(Date);
  expect(found?.totalCents).toBe(100);
});

it('listAll returns newest first', async () => {
  await repo.create(makeOrder('old', new Date('2026-01-01T00:00:00.000Z')));
  await repo.create(makeOrder('new', new Date('2026-02-01T00:00:00.000Z')));
  const all = await repo.listAll();
  expect(all.map(o => o.id)).toEqual(['new', 'old']);
});

it('updateStatus changes status and reports existence', async () => {
  await repo.create(makeOrder('o1', new Date()));
  expect(await repo.updateStatus('o1', 'paid')).toBe(true);
  expect(await repo.updateStatus('missing', 'paid')).toBe(false);
  expect((await repo.findById('o1'))?.status).toBe('paid');
});
```

- [ ] **Step 2: Rodar e confirmar falha**

Run: `pnpm --filter @arateki/api exec vitest run src/infrastructure/sqlite/sqlite-order-repository.test.ts`
Expected: FAIL — módulo não encontrado.

- [ ] **Step 3: Implementar o repositório**

Create `apps/api/src/infrastructure/sqlite/sqlite-order-repository.ts`:

```ts
import type Database from 'better-sqlite3';
import type { Order, OrderRepository, OrderStatus } from '../../domain/order.js';

interface OrderRow { doc: string }

export class SqliteOrderRepository implements OrderRepository {
  constructor(private readonly db: Database.Database) {}

  async create(order: Order): Promise<Order> {
    this.db
      .prepare(`INSERT INTO orders (id, doc, status, contact_email, created_at) VALUES (?, ?, ?, ?, ?)`)
      .run(order.id, JSON.stringify(order), order.status, order.contact.email, order.createdAt.toISOString());
    return order;
  }

  async findById(id: string): Promise<Order | null> {
    const row = this.db.prepare(`SELECT doc FROM orders WHERE id = ?`).get(id) as OrderRow | undefined;
    return row ? rowToOrder(row) : null;
  }

  async listAll(): Promise<Order[]> {
    const rows = this.db.prepare(`SELECT doc FROM orders ORDER BY created_at DESC`).all() as OrderRow[];
    return rows.map(rowToOrder);
  }

  async updateStatus(id: string, status: OrderStatus): Promise<boolean> {
    const existing = await this.findById(id);
    if (!existing) return false;
    const updated: Order = { ...existing, status, updatedAt: new Date() };
    this.db.prepare(`UPDATE orders SET doc = ?, status = ? WHERE id = ?`).run(JSON.stringify(updated), status, id);
    return true;
  }

  async ensureIndexes(): Promise<void> {
    // índices criados no schema; método mantido por compatibilidade da interface
  }
}

function rowToOrder(row: OrderRow): Order {
  const parsed = JSON.parse(row.doc) as Order;
  return { ...parsed, createdAt: new Date(parsed.createdAt), updatedAt: new Date(parsed.updatedAt) };
}
```

- [ ] **Step 4: Rodar e confirmar sucesso**

Run: `pnpm --filter @arateki/api exec vitest run src/infrastructure/sqlite/sqlite-order-repository.test.ts`
Expected: PASS (3 testes).

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/infrastructure/sqlite/sqlite-order-repository.ts apps/api/src/infrastructure/sqlite/sqlite-order-repository.test.ts
git commit -m "feat(api): add SqliteOrderRepository"
```

---

### Task 4: SqliteUserRepository

**Files:**
- Create: `apps/api/src/infrastructure/sqlite/sqlite-user-repository.ts`
- Create: `apps/api/src/infrastructure/sqlite/sqlite-user-repository.test.ts`

**Interfaces:**
- Consumes: `BootstrapAdminInput`, `User`, `UserRepository` de `domain/user.js`; `PasswordHasher` de `infrastructure/password-hasher.js`.
- Produces: `class SqliteUserRepository implements UserRepository`. `updatePassword` incrementa `tokenVersion` e devolve o usuário atualizado.

- [ ] **Step 1: Escrever os testes falhos**

Create `apps/api/src/infrastructure/sqlite/sqlite-user-repository.test.ts`:

```ts
import { openDatabase, type SqliteConnection } from './sqlite.js';
import { SqliteUserRepository } from './sqlite-user-repository.js';

let conn: SqliteConnection;
let repo: SqliteUserRepository;
beforeEach(() => { conn = openDatabase(':memory:'); repo = new SqliteUserRepository(conn.db); });
afterEach(() => conn.close());

it('ensureAdmin creates once and is idempotent', async () => {
  const a = await repo.ensureAdmin({ login: 'admin', password: 'a-very-long-pass' });
  const b = await repo.ensureAdmin({ login: 'admin', password: 'a-very-long-pass' });
  expect(a.id).toBe(b.id);
  expect(await repo.hasAdmin()).toBe(true);
});

it('finds by login and id with Date instances', async () => {
  const created = await repo.ensureAdmin({ login: 'admin', password: 'a-very-long-pass' });
  const byLogin = await repo.findByLogin('admin');
  const byId = await repo.findById(created.id);
  expect(byLogin?.id).toBe(created.id);
  expect(byId?.createdAt).toBeInstanceOf(Date);
});

it('updatePassword bumps tokenVersion', async () => {
  const created = await repo.ensureAdmin({ login: 'admin', password: 'a-very-long-pass' });
  const updated = await repo.updatePassword(created.id, 'new-hash');
  expect(updated?.passwordHash).toBe('new-hash');
  expect(updated?.tokenVersion).toBe(created.tokenVersion + 1);
});
```

- [ ] **Step 2: Rodar e confirmar falha**

Run: `pnpm --filter @arateki/api exec vitest run src/infrastructure/sqlite/sqlite-user-repository.test.ts`
Expected: FAIL — módulo não encontrado.

- [ ] **Step 3: Implementar o repositório**

Create `apps/api/src/infrastructure/sqlite/sqlite-user-repository.ts`:

```ts
import { randomUUID } from 'node:crypto';
import type Database from 'better-sqlite3';
import type { BootstrapAdminInput, User, UserRepository } from '../../domain/user.js';
import { PasswordHasher } from '../password-hasher.js';

interface UserRow { doc: string }

export class SqliteUserRepository implements UserRepository {
  constructor(
    private readonly db: Database.Database,
    private readonly passwordHasher = new PasswordHasher(),
  ) {}

  async findByLogin(login: string): Promise<User | null> {
    const row = this.db.prepare(`SELECT doc FROM users WHERE login = ?`).get(login) as UserRow | undefined;
    return row ? rowToUser(row) : null;
  }

  async findById(id: string): Promise<User | null> {
    const row = this.db.prepare(`SELECT doc FROM users WHERE id = ?`).get(id) as UserRow | undefined;
    return row ? rowToUser(row) : null;
  }

  async hasAdmin(): Promise<boolean> {
    const row = this.db.prepare(`SELECT 1 FROM users WHERE json_extract(doc, '$.role') = 'admin' LIMIT 1`).get();
    return row !== undefined;
  }

  async ensureAdmin(input: BootstrapAdminInput): Promise<User> {
    const existing = this.db
      .prepare(`SELECT doc FROM users WHERE json_extract(doc, '$.role') = 'admin' LIMIT 1`)
      .get() as UserRow | undefined;
    if (existing) return rowToUser(existing);

    const now = new Date();
    const user: User = {
      id: randomUUID(),
      login: input.login,
      passwordHash: await this.passwordHasher.hash(input.password),
      role: 'admin',
      tokenVersion: 0,
      createdAt: now,
      updatedAt: now,
    };
    this.db.prepare(`INSERT INTO users (id, doc, login) VALUES (?, ?, ?)`).run(user.id, JSON.stringify(user), user.login);
    return user;
  }

  async updatePassword(id: string, passwordHash: string): Promise<User | null> {
    const existing = await this.findById(id);
    if (!existing) return null;
    const updated: User = {
      ...existing,
      passwordHash,
      tokenVersion: existing.tokenVersion + 1,
      updatedAt: new Date(),
    };
    this.db.prepare(`UPDATE users SET doc = ? WHERE id = ?`).run(JSON.stringify(updated), id);
    return updated;
  }

  async ensureIndexes(): Promise<void> {
    // login UNIQUE garantido pelo schema; método mantido por compatibilidade da interface
  }
}

function rowToUser(row: UserRow): User {
  const parsed = JSON.parse(row.doc) as User;
  return { ...parsed, createdAt: new Date(parsed.createdAt), updatedAt: new Date(parsed.updatedAt) };
}
```

- [ ] **Step 4: Rodar e confirmar sucesso**

Run: `pnpm --filter @arateki/api exec vitest run src/infrastructure/sqlite/sqlite-user-repository.test.ts`
Expected: PASS (3 testes).

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/infrastructure/sqlite/sqlite-user-repository.ts apps/api/src/infrastructure/sqlite/sqlite-user-repository.test.ts
git commit -m "feat(api): add SqliteUserRepository"
```

---

### Task 5: SqliteAuditLogRepository e SqliteRevokedTokenRepository

**Files:**
- Create: `apps/api/src/infrastructure/sqlite/sqlite-audit-log-repository.ts`
- Create: `apps/api/src/infrastructure/sqlite/sqlite-revoked-token-repository.ts`
- Create: `apps/api/src/infrastructure/sqlite/sqlite-revoked-token-repository.test.ts`

**Interfaces:**
- Consumes: `AuditLog`, `AuditLogInput`, `AuditLogRepository`; `RevokedToken`, `RevokedTokenRepository`.
- Produces: `class SqliteAuditLogRepository implements AuditLogRepository`; `class SqliteRevokedTokenRepository implements RevokedTokenRepository` com método extra `purgeExpired(now?: Date): number` (limpeza de TTL — SQLite não tem TTL nativo), usado no boot/cron.

- [ ] **Step 1: Escrever os testes falhos (revoked token)**

Create `apps/api/src/infrastructure/sqlite/sqlite-revoked-token-repository.test.ts`:

```ts
import { openDatabase, type SqliteConnection } from './sqlite.js';
import { SqliteRevokedTokenRepository } from './sqlite-revoked-token-repository.js';

let conn: SqliteConnection;
let repo: SqliteRevokedTokenRepository;
beforeEach(() => { conn = openDatabase(':memory:'); repo = new SqliteRevokedTokenRepository(conn.db); });
afterEach(() => conn.close());

it('revoke is idempotent and isRevoked detects it', async () => {
  await repo.revoke({ id: 'jti-1', expiresAt: new Date(Date.now() + 60_000), createdAt: new Date() });
  await repo.revoke({ id: 'jti-1', expiresAt: new Date(Date.now() + 60_000), createdAt: new Date() });
  expect(await repo.isRevoked('jti-1')).toBe(true);
  expect(await repo.isRevoked('jti-2')).toBe(false);
});

it('purgeExpired removes only expired tokens', async () => {
  await repo.revoke({ id: 'old', expiresAt: new Date('2020-01-01'), createdAt: new Date() });
  await repo.revoke({ id: 'fresh', expiresAt: new Date(Date.now() + 60_000), createdAt: new Date() });
  expect(repo.purgeExpired()).toBe(1);
  expect(await repo.isRevoked('old')).toBe(false);
  expect(await repo.isRevoked('fresh')).toBe(true);
});
```

- [ ] **Step 2: Rodar e confirmar falha**

Run: `pnpm --filter @arateki/api exec vitest run src/infrastructure/sqlite/sqlite-revoked-token-repository.test.ts`
Expected: FAIL — módulo não encontrado.

- [ ] **Step 3: Implementar os dois repositórios**

Create `apps/api/src/infrastructure/sqlite/sqlite-audit-log-repository.ts`:

```ts
import { randomUUID } from 'node:crypto';
import type Database from 'better-sqlite3';
import type { AuditLog, AuditLogInput, AuditLogRepository } from '../../domain/audit-log.js';

export class SqliteAuditLogRepository implements AuditLogRepository {
  constructor(private readonly db: Database.Database) {}

  async record(input: AuditLogInput): Promise<void> {
    const entry: AuditLog = { id: randomUUID(), ...input, at: new Date() };
    this.db
      .prepare(`INSERT INTO audit_logs (id, doc, created_at) VALUES (?, ?, ?)`)
      .run(entry.id, JSON.stringify(entry), entry.at.toISOString());
  }
}
```

Create `apps/api/src/infrastructure/sqlite/sqlite-revoked-token-repository.ts`:

```ts
import type Database from 'better-sqlite3';
import type { RevokedToken, RevokedTokenRepository } from '../../domain/revoked-token.js';

export class SqliteRevokedTokenRepository implements RevokedTokenRepository {
  constructor(private readonly db: Database.Database) {}

  async revoke(input: RevokedToken): Promise<void> {
    this.db
      .prepare(`INSERT OR IGNORE INTO revoked_tokens (jti, expires_at) VALUES (?, ?)`)
      .run(input.id, input.expiresAt.toISOString());
  }

  async isRevoked(id: string): Promise<boolean> {
    const row = this.db.prepare(`SELECT 1 FROM revoked_tokens WHERE jti = ? LIMIT 1`).get(id);
    return row !== undefined;
  }

  async ensureIndexes(): Promise<void> {
    // índice criado no schema; método mantido por compatibilidade da interface
  }

  purgeExpired(now: Date = new Date()): number {
    const result = this.db.prepare(`DELETE FROM revoked_tokens WHERE expires_at < ?`).run(now.toISOString());
    return result.changes;
  }
}
```

- [ ] **Step 4: Rodar e confirmar sucesso**

Run: `pnpm --filter @arateki/api exec vitest run src/infrastructure/sqlite/sqlite-revoked-token-repository.test.ts`
Expected: PASS (2 testes).

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/infrastructure/sqlite/sqlite-audit-log-repository.ts apps/api/src/infrastructure/sqlite/sqlite-revoked-token-repository.ts apps/api/src/infrastructure/sqlite/sqlite-revoked-token-repository.test.ts
git commit -m "feat(api): add Sqlite audit-log and revoked-token repositories"
```

---

### Task 6: Port de transação + SqliteTransactionRunner

**Files:**
- Create: `apps/api/src/domain/transaction.ts`
- Create: `apps/api/src/infrastructure/sqlite/sqlite-transaction-runner.ts`
- Create: `apps/api/src/infrastructure/sqlite/sqlite-transaction-runner.test.ts`

**Interfaces:**
- Produces: `interface TransactionRunner { run<T>(work: () => Promise<T>): Promise<T> }`; `class SqliteTransactionRunner implements TransactionRunner`. As transações são **serializadas** (uma por vez) para evitar `BEGIN`-dentro-de-`BEGIN` no `better-sqlite3` síncrono sob requisições concorrentes. Em erro dentro de `work`, faz `ROLLBACK` e propaga o erro.

- [ ] **Step 1: Escrever os testes falhos**

Create `apps/api/src/infrastructure/sqlite/sqlite-transaction-runner.test.ts`:

```ts
import { openDatabase, type SqliteConnection } from './sqlite.js';
import { SqliteTransactionRunner } from './sqlite-transaction-runner.js';

let conn: SqliteConnection;
let runner: SqliteTransactionRunner;
beforeEach(() => {
  conn = openDatabase(':memory:');
  conn.db.exec(`CREATE TABLE t (id INTEGER PRIMARY KEY, v INTEGER)`);
  runner = new SqliteTransactionRunner(conn.db);
});
afterEach(() => conn.close());

it('commits successful work', async () => {
  await runner.run(async () => { conn.db.prepare(`INSERT INTO t (v) VALUES (1)`).run(); });
  const count = (conn.db.prepare(`SELECT COUNT(*) AS n FROM t`).get() as { n: number }).n;
  expect(count).toBe(1);
});

it('rolls back on error', async () => {
  await expect(runner.run(async () => {
    conn.db.prepare(`INSERT INTO t (v) VALUES (1)`).run();
    throw new Error('boom');
  })).rejects.toThrow('boom');
  const count = (conn.db.prepare(`SELECT COUNT(*) AS n FROM t`).get() as { n: number }).n;
  expect(count).toBe(0);
});

it('serializes concurrent transactions without nesting errors', async () => {
  await Promise.all([
    runner.run(async () => { conn.db.prepare(`INSERT INTO t (v) VALUES (1)`).run(); }),
    runner.run(async () => { conn.db.prepare(`INSERT INTO t (v) VALUES (2)`).run(); }),
  ]);
  const count = (conn.db.prepare(`SELECT COUNT(*) AS n FROM t`).get() as { n: number }).n;
  expect(count).toBe(2);
});
```

- [ ] **Step 2: Rodar e confirmar falha**

Run: `pnpm --filter @arateki/api exec vitest run src/infrastructure/sqlite/sqlite-transaction-runner.test.ts`
Expected: FAIL — módulos não encontrados.

- [ ] **Step 3: Implementar o port e o runner**

Create `apps/api/src/domain/transaction.ts`:

```ts
export interface TransactionRunner {
  run<T>(work: () => Promise<T>): Promise<T>;
}
```

Create `apps/api/src/infrastructure/sqlite/sqlite-transaction-runner.ts`:

```ts
import type Database from 'better-sqlite3';
import type { TransactionRunner } from '../../domain/transaction.js';

export class SqliteTransactionRunner implements TransactionRunner {
  private queue: Promise<unknown> = Promise.resolve();

  constructor(private readonly db: Database.Database) {}

  run<T>(work: () => Promise<T>): Promise<T> {
    const result = this.queue.then(async () => {
      this.db.exec('BEGIN IMMEDIATE');
      try {
        const value = await work();
        this.db.exec('COMMIT');
        return value;
      } catch (error) {
        this.db.exec('ROLLBACK');
        throw error;
      }
    });
    this.queue = result.catch(() => undefined);
    return result as Promise<T>;
  }
}
```

- [ ] **Step 4: Rodar e confirmar sucesso**

Run: `pnpm --filter @arateki/api exec vitest run src/infrastructure/sqlite/sqlite-transaction-runner.test.ts`
Expected: PASS (3 testes).

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/domain/transaction.ts apps/api/src/infrastructure/sqlite/sqlite-transaction-runner.ts apps/api/src/infrastructure/sqlite/sqlite-transaction-runner.test.ts
git commit -m "feat(api): add transaction port and SQLite runner"
```

---

### Task 7: Cortar o MongoDB do domínio e da aplicação

Esta é uma task de **corte coeso**: remove o acoplamento ao MongoDB do domínio/aplicação e apaga os repositórios Mongo. A compilação só volta a fechar ao fim da Task 8 (wiring), portanto a verificação aqui é a do teste de `create-order`.

**Files:**
- Modify: `apps/api/src/domain/order.ts` (remover `import ClientSession`, remover `session?` de `create`)
- Modify: `apps/api/src/domain/product.ts` (remover `import ClientSession`, remover `session?` de `findActiveById`/`findById`/`decrementStock`)
- Modify: `apps/api/src/application/create-order.ts` (usar `TransactionRunner`)
- Modify: `apps/api/src/application/create-order.test.ts` (instanciar com repos SQLite + runner)
- Modify: `apps/api/src/app.ts` (`AppDependencies`: trocar `mongoClient` por `transactionRunner`)
- Delete: `apps/api/src/infrastructure/mongo.ts` e os 5 `mongo-*-repository.ts`

**Interfaces:**
- Consumes: `TransactionRunner` (Task 6); repositórios SQLite (Tasks 2-5).
- Produces: `CreateOrderUseCase` com construtor `(orders: OrderRepository, products: ProductRepository, tx: TransactionRunner)`. `AppDependencies.transactionRunner: TransactionRunner` (no lugar de `mongoClient`).

- [ ] **Step 1: Remover `ClientSession` do domínio**

Em `apps/api/src/domain/order.ts`: apagar a linha `import type { ClientSession } from 'mongodb';` e mudar a assinatura para `create(order: Order): Promise<Order>;`.

Em `apps/api/src/domain/product.ts`: apagar `import type { ClientSession } from 'mongodb';` e remover `, session?: ClientSession` de `findActiveById`, `findById` e `decrementStock` na interface `ProductRepository`.

- [ ] **Step 2: Atualizar o teste de create-order**

Substituir o conteúdo de `apps/api/src/application/create-order.test.ts` por uma versão que usa SQLite em memória (mantendo os casos de negócio existentes — sucesso, `INSUFFICIENT_STOCK`, `PRODUCT_NOT_FOUND`):

```ts
import { openDatabase, type SqliteConnection } from '../infrastructure/sqlite/sqlite.js';
import { SqliteProductRepository } from '../infrastructure/sqlite/sqlite-product-repository.js';
import { SqliteOrderRepository } from '../infrastructure/sqlite/sqlite-order-repository.js';
import { SqliteTransactionRunner } from '../infrastructure/sqlite/sqlite-transaction-runner.js';
import { CreateOrderUseCase, CreateOrderError } from './create-order.js';
import type { Product } from '../domain/product.js';

let conn: SqliteConnection;
let useCase: CreateOrderUseCase;
let product: Product;

beforeEach(async () => {
  conn = openDatabase(':memory:');
  const products = new SqliteProductRepository(conn.db);
  const orders = new SqliteOrderRepository(conn.db);
  useCase = new CreateOrderUseCase(orders, products, new SqliteTransactionRunner(conn.db));
  product = await products.create({
    name: { pt: 'p', en: 'p', es: 'p', zh: 'p', ja: 'p' },
    description: { pt: 'd', en: 'd', es: 'd', zh: 'd', ja: 'd' },
    variants: [{ sku: 'SKU-1', attributes: {}, prices: { brlCents: 1000, usdCents: 200 }, stock: 5 }],
  });
});
afterEach(() => conn.close());

it('creates an order and decrements stock', async () => {
  const order = await useCase.execute({
    contact: { name: 'Y', email: 'y@a.com', phone: '1' },
    address: { country: 'BR', postalCode: '1', state: 'SP', city: 'SP', line1: 'x' },
    items: [{ productId: product.id, variantId: product.variants[0]!.id, quantity: 2 }],
    locale: 'pt',
  });
  expect(order.totalCents).toBe(2000);
  expect(order.currency).toBe('BRL');
});

it('rejects insufficient stock and rolls back', async () => {
  await expect(useCase.execute({
    contact: { name: 'Y', email: 'y@a.com', phone: '1' },
    address: { country: 'BR', postalCode: '1', state: 'SP', city: 'SP', line1: 'x' },
    items: [{ productId: product.id, variantId: product.variants[0]!.id, quantity: 99 }],
    locale: 'pt',
  })).rejects.toBeInstanceOf(CreateOrderError);
  const products = new SqliteProductRepository(conn.db);
  expect((await products.findById(product.id))?.variants[0]?.stock).toBe(5);
});

it('rejects unknown product', async () => {
  await expect(useCase.execute({
    contact: { name: 'Y', email: 'y@a.com', phone: '1' },
    address: { country: 'BR', postalCode: '1', state: 'SP', city: 'SP', line1: 'x' },
    items: [{ productId: 'nope', variantId: 'nope', quantity: 1 }],
    locale: 'pt',
  })).rejects.toBeInstanceOf(CreateOrderError);
});
```

- [ ] **Step 3: Rodar o teste e confirmar a falha**

Run: `pnpm --filter @arateki/api exec vitest run src/application/create-order.test.ts`
Expected: FAIL — `CreateOrderUseCase` ainda espera `MongoClient`.

- [ ] **Step 4: Reescrever o use-case**

Substituir o conteúdo de `apps/api/src/application/create-order.ts`:

```ts
import { randomUUID } from 'node:crypto';
import type { CreateOrderInput, Order, OrderRepository } from '../domain/order.js';
import type { Currency, Product, ProductRepository, ProductVariant } from '../domain/product.js';
import type { TransactionRunner } from '../domain/transaction.js';

export type CreateOrderErrorCode = 'PRODUCT_NOT_FOUND' | 'VARIANT_NOT_FOUND' | 'INSUFFICIENT_STOCK';

export class CreateOrderError extends Error {
  constructor(
    readonly code: CreateOrderErrorCode,
    readonly details: Record<string, string | number>,
  ) {
    super(code);
  }
}

export class CreateOrderUseCase {
  constructor(
    private readonly orders: OrderRepository,
    private readonly products: ProductRepository,
    private readonly tx: TransactionRunner,
  ) {}

  async execute(input: CreateOrderInput): Promise<Order> {
    return this.tx.run(async () => {
      const currency = currencyFromCountry(input.address.country);

      const items = await Promise.all(
        input.items.map(async item => {
          const product = await this.products.findActiveById(item.productId);
          if (!product) {
            throw new CreateOrderError('PRODUCT_NOT_FOUND', { productId: item.productId });
          }
          const variant = product.variants.find(
            currentVariant => currentVariant.id === item.variantId && currentVariant.active,
          );
          if (!variant) {
            throw new CreateOrderError('VARIANT_NOT_FOUND', { productId: item.productId, variantId: item.variantId });
          }
          if (variant.stock < item.quantity) {
            throw new CreateOrderError('INSUFFICIENT_STOCK', {
              productId: item.productId,
              variantId: item.variantId,
              availableStock: variant.stock,
            });
          }
          await this.products.decrementStock(item.productId, item.variantId, item.quantity);
          return toOrderItem(product, variant, item.quantity, currency, input.locale);
        }),
      );

      const now = new Date();
      const order: Order = {
        id: randomUUID(),
        status: 'pending',
        contact: input.contact,
        address: { ...input.address, country: input.address.country.toUpperCase() },
        items,
        currency,
        totalCents: items.reduce((sum, item) => sum + item.subtotalCents, 0),
        createdAt: now,
        updatedAt: now,
      };
      return this.orders.create(order);
    });
  }
}

function currencyFromCountry(country: string): Currency {
  return country.toUpperCase() === 'BR' ? 'BRL' : 'USD';
}

function toOrderItem(
  product: Product,
  variant: ProductVariant,
  quantity: number,
  currency: Currency,
  locale: CreateOrderInput['locale'],
) {
  const unitPriceCents = currency === 'BRL' ? variant.prices.brlCents : variant.prices.usdCents;
  return {
    productId: product.id,
    variantId: variant.id,
    sku: variant.sku,
    name: product.name[locale] || product.name.en,
    quantity,
    unitPriceCents,
    subtotalCents: unitPriceCents * quantity,
  };
}
```

- [ ] **Step 5: Atualizar `AppDependencies` em `app.ts`**

Em `apps/api/src/app.ts`: remover `import type { MongoClient } from 'mongodb';` e adicionar `import type { TransactionRunner } from './domain/transaction.js';`. Na interface `AppDependencies`, trocar `mongoClient: MongoClient;` por `transactionRunner: TransactionRunner;`. Na construção do `CreateOrderUseCase`, trocar `dependencies.mongoClient` por `dependencies.transactionRunner`.

- [ ] **Step 6: Apagar os arquivos Mongo**

```bash
git rm apps/api/src/infrastructure/mongo.ts \
  apps/api/src/infrastructure/mongo-order-repository.ts \
  apps/api/src/infrastructure/mongo-product-repository.ts \
  apps/api/src/infrastructure/mongo-user-repository.ts \
  apps/api/src/infrastructure/mongo-audit-log-repository.ts \
  apps/api/src/infrastructure/mongo-revoked-token-repository.ts
```

- [ ] **Step 7: Rodar o teste de create-order e confirmar sucesso**

Run: `pnpm --filter @arateki/api exec vitest run src/application/create-order.test.ts`
Expected: PASS (3 testes).

- [ ] **Step 8: Commit**

```bash
git add -A apps/api/src
git commit -m "refactor(api): replace MongoDB transaction coupling with neutral port"
```

---

### Task 8: Wiring SQLite (env, main, test-app) e suíte completa verde

**Files:**
- Modify: `apps/api/src/config/env.ts` (`mongodbUri` → `sqlitePath`)
- Modify: `apps/api/src/main.ts` (instanciar SQLite + runner + purge no boot)
- Modify: `apps/api/src/test/test-app.ts` (SQLite `:memory:`)
- Modify: `apps/api/package.json` (remover `mongodb` e `mongodb-memory-server`)
- Modify: `apps/api/.env.example` (`MONGODB_URI` → `SQLITE_PATH`)

**Interfaces:**
- Consumes: `openDatabase`, todos os repositórios SQLite, `SqliteTransactionRunner`.
- Produces: API totalmente cabeada em SQLite; `Env.sqlitePath: string`.

- [ ] **Step 1: Atualizar `env.ts`**

Em `apps/api/src/config/env.ts`: na interface `Env`, trocar `mongodbUri: string;` por `sqlitePath: string;`. Em `loadEnv()`, trocar a linha do mongo por:

```ts
sqlitePath: readEnv('SQLITE_PATH', nodeEnv === 'test' ? ':memory:' : '/var/lib/arateki/arateki.db'),
```

- [ ] **Step 2: Atualizar `main.ts`**

Substituir o bloco de criação de conexão/repos por SQLite:

```ts
import { buildApp } from './app.js';
import { BootstrapAdminUseCase } from './application/bootstrap-admin.js';
import { defaultProducts } from './config/default-products.js';
import { loadEnv } from './config/env.js';
import { openDatabase } from './infrastructure/sqlite/sqlite.js';
import { SqliteOrderRepository } from './infrastructure/sqlite/sqlite-order-repository.js';
import { SqliteProductRepository } from './infrastructure/sqlite/sqlite-product-repository.js';
import { SqliteAuditLogRepository } from './infrastructure/sqlite/sqlite-audit-log-repository.js';
import { SqliteRevokedTokenRepository } from './infrastructure/sqlite/sqlite-revoked-token-repository.js';
import { SqliteUserRepository } from './infrastructure/sqlite/sqlite-user-repository.js';
import { SqliteTransactionRunner } from './infrastructure/sqlite/sqlite-transaction-runner.js';

const env = loadEnv();
const sqlite = openDatabase(env.sqlitePath);

const productRepository = new SqliteProductRepository(sqlite.db);
const orderRepository = new SqliteOrderRepository(sqlite.db);
const auditLogRepository = new SqliteAuditLogRepository(sqlite.db);
const userRepository = new SqliteUserRepository(sqlite.db);
const revokedTokenRepository = new SqliteRevokedTokenRepository(sqlite.db);
const transactionRunner = new SqliteTransactionRunner(sqlite.db);

await productRepository.seedIfEmpty(defaultProducts);
revokedTokenRepository.purgeExpired();
await new BootstrapAdminUseCase(userRepository).execute({
  login: env.adminLogin,
  password: env.adminPassword,
});

const app = await buildApp({
  productRepository,
  orderRepository,
  auditLogRepository,
  userRepository,
  revokedTokenRepository,
  transactionRunner,
  jwtSecret: env.jwtSecret,
  jwtExpiresIn: env.jwtExpiresIn,
  corsOrigin: env.corsOrigin,
  publicSiteUrl: env.publicSiteUrl,
});

const shutdown = async () => {
  await app.close();
  sqlite.close();
};

process.on('SIGINT', () => { void shutdown().then(() => process.exit(0)); });
process.on('SIGTERM', () => { void shutdown().then(() => process.exit(0)); });

await app.listen({ port: env.port, host: env.host });
```

(As chamadas a `ensureIndexes()` deixam de ser necessárias — o schema já cria os índices. Removê-las do boot.)

- [ ] **Step 3: Atualizar `test-app.ts`**

Substituir o conteúdo de `apps/api/src/test/test-app.ts`:

```ts
import type { FastifyInstance } from 'fastify';
import { buildApp } from '../app.js';
import { defaultProducts } from '../config/default-products.js';
import { openDatabase, type SqliteConnection } from '../infrastructure/sqlite/sqlite.js';
import { SqliteOrderRepository } from '../infrastructure/sqlite/sqlite-order-repository.js';
import { SqliteProductRepository } from '../infrastructure/sqlite/sqlite-product-repository.js';
import { SqliteAuditLogRepository } from '../infrastructure/sqlite/sqlite-audit-log-repository.js';
import { SqliteRevokedTokenRepository } from '../infrastructure/sqlite/sqlite-revoked-token-repository.js';
import { SqliteUserRepository } from '../infrastructure/sqlite/sqlite-user-repository.js';
import { SqliteTransactionRunner } from '../infrastructure/sqlite/sqlite-transaction-runner.js';

export interface TestApp {
  app: FastifyInstance;
  sqlite: SqliteConnection;
  jwtSecret: string;
  adminUserId: string;
  close(): Promise<void>;
}

export async function createTestApp(): Promise<TestApp> {
  const sqlite = openDatabase(':memory:');
  const productRepository = new SqliteProductRepository(sqlite.db);
  const orderRepository = new SqliteOrderRepository(sqlite.db);
  const auditLogRepository = new SqliteAuditLogRepository(sqlite.db);
  const userRepository = new SqliteUserRepository(sqlite.db);
  const revokedTokenRepository = new SqliteRevokedTokenRepository(sqlite.db);
  const transactionRunner = new SqliteTransactionRunner(sqlite.db);
  const jwtSecret = 'test-secret';

  await productRepository.seedIfEmpty(defaultProducts);
  const admin = await userRepository.ensureAdmin({ login: 'admin', password: 'admin-password' });

  const app = await buildApp({
    productRepository,
    orderRepository,
    auditLogRepository,
    userRepository,
    revokedTokenRepository,
    transactionRunner,
    jwtSecret,
    jwtExpiresIn: '1h',
    publicSiteUrl: 'https://arateki.test',
  });
  await app.ready();

  return {
    app,
    sqlite,
    jwtSecret,
    adminUserId: admin.id,
    close: async () => {
      await app.close();
      sqlite.close();
    },
  };
}
```

> Se algum teste consumir `testApp.mongo`/`testApp.mongoServer`, trocar por `testApp.sqlite`. Rodar a suíte (próximo passo) revela qualquer uso remanescente.

- [ ] **Step 4: Remover dependências do Mongo**

Run: `pnpm --filter @arateki/api remove mongodb mongodb-memory-server`
Expected: somem de `apps/api/package.json`.

- [ ] **Step 5: Atualizar `.env.example`**

Em `apps/api/.env.example`: trocar a linha `MONGODB_URI=mongodb://localhost:27017/arateki` por `SQLITE_PATH=/var/lib/arateki/arateki.db`.

- [ ] **Step 6: Rodar a suíte inteira e o build**

Run: `pnpm --filter @arateki/api test && pnpm --filter @arateki/api build`
Expected: todos os testes PASS; `tsc` sem erros. Corrigir qualquer import remanescente de `mongodb` que apareça.

- [ ] **Step 7: Commit**

```bash
git add -A apps/api
git commit -m "feat(api): wire SQLite end-to-end and drop MongoDB dependency"
```

---

### Task 9: Empacotamento bare-metal (systemd + nginx + backup)

**Files:**
- Create: `deploy/arateki-api.service`
- Create: `deploy/nginx-arateki.conf`
- Create: `deploy/backup-arateki.sh`
- Create: `deploy/README.md`

**Interfaces:** artefatos de operação consumidos pelo deploy (Task 11). Não há teste unitário; a verificação é por análise de configuração.

- [ ] **Step 1: Criar a unit systemd**

Create `deploy/arateki-api.service`:

```ini
[Unit]
Description=Arateki API (SQLite, bare-metal)
After=network.target

[Service]
Type=simple
User=arateki
WorkingDirectory=/opt/arateki/api
ExecStart=/usr/bin/node dist/main.js
EnvironmentFile=/etc/arateki/api.env
Restart=on-failure
RestartSec=2
NoNewPrivileges=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=/var/lib/arateki
PrivateTmp=true

[Install]
WantedBy=multi-user.target
```

- [ ] **Step 2: Criar a configuração nginx**

Create `deploy/nginx-arateki.conf`:

```nginx
server {
  listen 80;
  server_name arateki.com www.arateki.com;
  root /var/www/arateki/dist-front;

  location /api/ {
    proxy_pass http://127.0.0.1:3333;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Forwarded-Host $host;
  }

  location / {
    try_files $uri $uri/ /index.html;
  }
}
```

- [ ] **Step 3: Criar o script de backup + purge**

Create `deploy/backup-arateki.sh`:

```bash
#!/usr/bin/env bash
set -euo pipefail
DB=/var/lib/arateki/arateki.db
DEST=/var/backups/arateki
mkdir -p "$DEST"
sqlite3 "$DB" ".backup '$DEST/arateki-$(date +%F).db'"
# retenção: manter os últimos 14 backups
ls -1t "$DEST"/arateki-*.db | tail -n +15 | xargs -r rm --
```

- [ ] **Step 4: Documentar o procedimento**

Create `deploy/README.md` com os passos de instalação na `t3.nano`: criar usuário `arateki`, `mkdir -p /var/lib/arateki /opt/arateki/api /etc/arateki`, copiar `api.env` (baseado em `.env.example`, com `SQLITE_PATH=/var/lib/arateki/arateki.db`, `HOST=127.0.0.1`), instalar a unit (`systemctl enable --now arateki-api`), instalar a config nginx, e agendar `backup-arateki.sh` no cron diário.

- [ ] **Step 5: Verificar a unit e a config**

Run: `systemd-analyze verify deploy/arateki-api.service; nginx -t -c "$PWD/deploy/nginx-arateki.conf" 2>&1 | tail -1 || true`
Expected: sem erros de sintaxe na unit (a verificação do nginx pode exigir contexto `http{}`; validar visualmente se o `-t` reclamar do contexto).

- [ ] **Step 6: Commit**

```bash
git add deploy/
git commit -m "chore(deploy): add systemd unit, nginx config and backup script"
```

---

### Task 10: Docker opcional (sem MongoDB)

**Files:**
- Modify: `apps/api/Dockerfile` (já empacota só a API; garantir `SQLITE_PATH` e volume)
- Modify: `docker-compose.yml` e `docker-compose.prod.yml` (remover serviço `mongodb`, adicionar volume do `.db`)

**Interfaces:** caminho de deploy alternativo para ambientes folgados.

- [ ] **Step 1: Ajustar o compose de produção**

Substituir `docker-compose.prod.yml` por uma versão com serviço único:

```yaml
services:
  api:
    image: arateki-api:latest
    container_name: arateki-api
    restart: unless-stopped
    ports:
      - "3333:3333"
    environment:
      - NODE_ENV=production
      - PORT=3333
      - HOST=0.0.0.0
      - SQLITE_PATH=/data/arateki.db
      - JWT_SECRET=${JWT_SECRET:?JWT_SECRET is required}
      - JWT_EXPIRES_IN=${JWT_EXPIRES_IN:-2h}
      - ADMIN_LOGIN=${ADMIN_LOGIN:-admin}
      - ADMIN_PASSWORD=${ADMIN_PASSWORD:?ADMIN_PASSWORD is required}
      - CORS_ORIGIN=${CORS_ORIGIN:-}
      - PUBLIC_SITE_URL=${PUBLIC_SITE_URL:-https://arateki.com}
    volumes:
      - arateki-sqlite-data:/data

volumes:
  arateki-sqlite-data:
```

- [ ] **Step 2: Ajustar o `docker-compose.yml` de desenvolvimento** da mesma forma (serviço único `api`, volume `/data`, `SQLITE_PATH=/data/arateki.db`).

- [ ] **Step 3: Garantir o Dockerfile**

No `apps/api/Dockerfile`, confirmar que o estágio de runtime declara `ENV SQLITE_PATH=/data/arateki.db`, cria `/data` e que `better-sqlite3` compila no `node:22-alpine` (Alpine usa musl — exige `apk add --no-cache python3 make g++` no estágio builder para o node-gyp, caso o prebuild musl não exista). Construir para validar.

- [ ] **Step 4: Validar o build da imagem**

Run: `docker build -f apps/api/Dockerfile -t arateki-api:test .`
Expected: build conclui; `docker run --rm -e JWT_SECRET=x -e ADMIN_PASSWORD=change-me-now-please arateki-api:test node -e "require('better-sqlite3')"` não lança.

- [ ] **Step 5: Commit**

```bash
git add apps/api/Dockerfile docker-compose.yml docker-compose.prod.yml
git commit -m "chore(docker): single-service SQLite image, drop MongoDB"
```

---

### Task 11: CI/CD — prerender com API-SQLite e deploy via SSH-push

**Files:**
- Modify: `.github/workflows/main.yml`

**Interfaces:** pipeline de build (GitHub-hosted) + deploy por SSH (sem runner residente na `t3.nano`).

- [ ] **Step 1: Trocar o prerender para a API-SQLite**

No job `build`, remover os passos `Build API Docker image`, `Save API Docker image` e `Upload API Image Artifact`. Substituir `Start API for Prerender` (que fazia `docker compose up mongodb api`) por:

```yaml
    - name: Start API (SQLite) for Prerender
      timeout-minutes: 5
      run: |
        echo "JWT_SECRET=${{ secrets.JWT_SECRET }}" > apps/api/.env.prerender
        echo "JWT_EXPIRES_IN=12h" >> apps/api/.env.prerender
        echo "ADMIN_LOGIN=${{ secrets.ADMIN_LOGIN }}" >> apps/api/.env.prerender
        echo "ADMIN_PASSWORD=${{ secrets.ADMIN_PASSWORD }}" >> apps/api/.env.prerender
        echo "SQLITE_PATH=/tmp/prerender.db" >> apps/api/.env.prerender
        echo "PUBLIC_SITE_URL=https://arateki.com" >> apps/api/.env.prerender
        node --env-file=apps/api/.env.prerender apps/api/dist/main.js &
        echo $! > /tmp/api.pid
```

Manter o passo `Wait for API` (health check em `127.0.0.1:3333`) e, após o prerender, encerrar com `kill "$(cat /tmp/api.pid)"`.

- [ ] **Step 2: Publicar o bundle da API como artefato**

Após `Build API`, adicionar empacotamento do runtime (dist + deps de produção):

```yaml
    - name: Package API runtime
      run: |
        mkdir -p api-bundle/apps/api
        cp -r apps/api/dist api-bundle/apps/api/dist
        cp apps/api/package.json api-bundle/apps/api/package.json
        cp pnpm-lock.yaml pnpm-workspace.yaml package.json api-bundle/
        cp -r deploy api-bundle/deploy
        tar czf api-bundle.tar.gz -C api-bundle .

    - name: Upload API bundle
      uses: actions/upload-artifact@v4
      with:
        name: api-bundle
        path: api-bundle.tar.gz
        retention-days: 1
```

- [ ] **Step 3: Reescrever o deploy da `t3.nano` para SSH-push**

Substituir o job `deploy-ec2-t3-nano` (runner self-hosted) por um job que roda em `ubuntu-latest` e conecta por SSH:

```yaml
  deploy-ec2-t3-nano:
    needs: build
    if: ${{ github.event_name == 'workflow_dispatch' && (github.event.inputs.target == 'ec2-t3-nano' || github.event.inputs.target == 'both') }}
    runs-on: ubuntu-latest
    environment: production
    steps:
    - name: Download Frontend Artifact
      uses: actions/download-artifact@v4
      with: { name: frontend-dist, path: dist-front }
    - name: Download API bundle
      uses: actions/download-artifact@v4
      with: { name: api-bundle, path: api-bundle }
    - name: Configure SSH
      run: |
        install -m 700 -d ~/.ssh
        echo "${{ secrets.EC2_SSH_KEY }}" > ~/.ssh/id_ed25519
        chmod 600 ~/.ssh/id_ed25519
        ssh-keyscan -H ${{ secrets.EC2_HOST }} >> ~/.ssh/known_hosts
    - name: Deploy frontend
      run: rsync -az --delete -e "ssh -i ~/.ssh/id_ed25519" dist-front/ deploy@${{ secrets.EC2_HOST }}:/var/www/arateki/dist-front/
    - name: Deploy API bundle
      run: |
        rsync -az -e "ssh -i ~/.ssh/id_ed25519" api-bundle/api-bundle.tar.gz deploy@${{ secrets.EC2_HOST }}:/tmp/api-bundle.tar.gz
        ssh -i ~/.ssh/id_ed25519 deploy@${{ secrets.EC2_HOST }} '
          set -e
          sudo rm -rf /opt/arateki/api && sudo mkdir -p /opt/arateki/api
          sudo tar xzf /tmp/api-bundle.tar.gz -C /opt/arateki
          cd /opt/arateki && sudo corepack pnpm install --prod --filter @arateki/api --frozen-lockfile
          sudo systemctl restart arateki-api
        '
```

> Secrets necessários: `EC2_SSH_KEY` (chave privada ed25519 dedicada), `EC2_HOST`. O usuário `deploy` precisa de regra `sudoers` para `rm`/`mkdir`/`tar` no `/opt/arateki`, `pnpm install` e `systemctl restart arateki-api` (ver `deploy/README.md`). Endurecer conforme §8.3 da spec.

- [ ] **Step 4: Validar o YAML**

Run: `python3 -c "import yaml,sys; yaml.safe_load(open('.github/workflows/main.yml')); print('yaml ok')"`
Expected: `yaml ok`.

- [ ] **Step 5: Commit**

```bash
git add .github/workflows/main.yml
git commit -m "ci: prerender with SQLite API and deploy t3.nano via SSH-push"
```

---

## Self-Review

**Spec coverage:**
- §5.1 repositórios SQLite → Tasks 2-5 ✓
- §5.2 schema JSON-column → Task 1 ✓
- §5.3 PRAGMAs/WAL → Task 1 ✓
- §5.4 port de transação + remoção de vazamentos → Tasks 6-7 ✓
- §5.5 env/main → Task 8 ✓
- §5.6 testes `:memory:` → Tasks 2-8 ✓
- §6 deploy bare-metal (systemd/nginx/env) → Task 9 ✓
- §7 Docker opcional → Task 10 ✓
- §8 CI (prerender + SSH-push) → Task 11 ✓
- §9 backup + limpeza de `revoked_tokens` → Tasks 5 (`purgeExpired`), 8 (boot), 9 (script) ✓

**Type consistency:** `openDatabase`/`SqliteConnection` (Task 1) reutilizados em todas; `TransactionRunner.run` (Task 6) consumido por `CreateOrderUseCase` (Task 7) e fornecido por `SqliteTransactionRunner`; `AppDependencies.transactionRunner` (Task 7) fornecido por `main.ts`/`test-app.ts` (Task 8). Repositórios implementam exatamente as interfaces de `domain/*`.

**Placeholders:** nenhum passo de código sem código; comentários "no-op" em `ensureIndexes` são intencionais (índices vivem no schema).

**Nota de risco conhecida:** a serialização de transações (Task 6) torna escritas transacionais sequenciais — aceitável para o volume da loja; registrado na spec §10.
