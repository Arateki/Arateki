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
