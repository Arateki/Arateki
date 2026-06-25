import { afterEach, beforeEach, expect, it } from 'vitest';
import { openDatabase, type SqliteConnection } from '../infrastructure/sqlite/sqlite.js';
import { SqliteOrderRepository } from '../infrastructure/sqlite/sqlite-order-repository.js';
import { SqliteProductRepository } from '../infrastructure/sqlite/sqlite-product-repository.js';
import { SqliteTransactionRunner } from '../infrastructure/sqlite/sqlite-transaction-runner.js';
import { CreateOrderError, CreateOrderUseCase } from './create-order.js';
import type { Product } from '../domain/product.js';

// Verifica o COMPORTAMENTO TRANSACIONAL real da implementação SQLite: quando um
// item de um pedido multi-item falha, o decremento de estoque já aplicado a
// itens anteriores precisa ser revertido (ROLLBACK). Fakes in-memory não
// reproduzem isso fielmente, por isso este caso vive sobre o SQLite real.
let conn: SqliteConnection;
let products: SqliteProductRepository;
let useCase: CreateOrderUseCase;
let inStock: Product;
let lowStock: Product;

beforeEach(async () => {
  conn = openDatabase(':memory:');
  products = new SqliteProductRepository(conn.db);
  const orders = new SqliteOrderRepository(conn.db);
  useCase = new CreateOrderUseCase(orders, products, new SqliteTransactionRunner(conn.db));

  inStock = await products.create({
    name: { pt: 'a', en: 'a', es: 'a', zh: 'a', ja: 'a' },
    description: { pt: 'd', en: 'd', es: 'd', zh: 'd', ja: 'd' },
    variants: [{ sku: 'A', attributes: {}, prices: { brlCents: 1000, usdCents: 200 }, stock: 5 }],
  });
  lowStock = await products.create({
    name: { pt: 'b', en: 'b', es: 'b', zh: 'b', ja: 'b' },
    description: { pt: 'd', en: 'd', es: 'd', zh: 'd', ja: 'd' },
    variants: [{ sku: 'B', attributes: {}, prices: { brlCents: 1000, usdCents: 200 }, stock: 1 }],
  });
});
afterEach(() => conn.close());

it('commits and decrements stock on success', async () => {
  await useCase.execute({
    contact: { name: 'Y', email: 'y@a.com', phone: '1' },
    address: { country: 'BR', postalCode: '1', state: 'SP', city: 'SP', line1: 'x' },
    items: [{ productId: inStock.id, variantId: inStock.variants[0]!.id, quantity: 2 }],
    locale: 'pt',
  });
  expect((await products.findById(inStock.id))?.variants[0]?.stock).toBe(3);
});

it('rolls back the whole order when a later item is out of stock', async () => {
  await expect(useCase.execute({
    contact: { name: 'Y', email: 'y@a.com', phone: '1' },
    address: { country: 'BR', postalCode: '1', state: 'SP', city: 'SP', line1: 'x' },
    items: [
      { productId: inStock.id, variantId: inStock.variants[0]!.id, quantity: 2 },
      { productId: lowStock.id, variantId: lowStock.variants[0]!.id, quantity: 99 },
    ],
    locale: 'pt',
  })).rejects.toBeInstanceOf(CreateOrderError);

  // O estoque do primeiro item deve permanecer intacto graças ao ROLLBACK.
  expect((await products.findById(inStock.id))?.variants[0]?.stock).toBe(5);
});
