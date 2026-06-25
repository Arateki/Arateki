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
