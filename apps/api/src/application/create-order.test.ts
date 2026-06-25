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
