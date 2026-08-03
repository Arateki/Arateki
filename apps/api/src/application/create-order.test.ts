import { beforeEach, expect, it } from 'vitest';
import type { Product } from '../domain/product.js';
import {
  ImmediateTransactionRunner,
  InMemoryOrderRepository,
  InMemoryProductRepository,
} from '../test/in-memory-repositories.js';
import { CreateOrderError, CreateOrderUseCase } from './create-order.js';

// Teste agnóstico de banco: exercita a regra de negócio sobre as portas de
// domínio via fakes in-memory. O comportamento transacional real (rollback)
// é coberto em create-order.sqlite.test.ts.
let products: InMemoryProductRepository;
let orders: InMemoryOrderRepository;
let useCase: CreateOrderUseCase;
let product: Product;

beforeEach(async () => {
  products = new InMemoryProductRepository();
  orders = new InMemoryOrderRepository();
  useCase = new CreateOrderUseCase(orders, products, new ImmediateTransactionRunner());
  product = await products.create({
    name: { pt: 'p', en: 'p', es: 'p', zh: 'p', ja: 'p' },
    description: { pt: 'd', en: 'd', es: 'd', zh: 'd', ja: 'd' },
    variants: [{ sku: 'SKU-1', attributes: {}, prices: { brlCents: 1000, usdCents: 200 }, stock: 5 }],
  });
});

it('creates an order, computes total/currency and decrements stock', async () => {
  const order = await useCase.execute({
    contact: { name: 'Y', email: 'y@a.com', phone: '1' },
    address: { country: 'br', postalCode: '1', state: 'SP', city: 'SP', line1: 'x' },
    items: [{ productId: product.id, variantId: product.variants[0]!.id, quantity: 2 }],
    locale: 'pt',
  });

  expect(order.totalCents).toBe(2000);
  expect(order.currency).toBe('BRL');
  expect(order.address.country).toBe('BR');
  expect(orders.orders).toHaveLength(1);
  expect((await products.findById(product.id))?.variants[0]?.stock).toBe(3);
});

it('uses USD pricing outside Brazil', async () => {
  const order = await useCase.execute({
    contact: { name: 'Y', email: 'y@a.com', phone: '1' },
    address: { country: 'US', postalCode: '10001', state: 'NY', city: 'NY', line1: 'x' },
    items: [{ productId: product.id, variantId: product.variants[0]!.id, quantity: 1 }],
    locale: 'en',
  });

  expect(order.currency).toBe('USD');
  expect(order.totalCents).toBe(200);
});

it('rejects insufficient stock', async () => {
  await expect(useCase.execute({
    contact: { name: 'Y', email: 'y@a.com', phone: '1' },
    address: { country: 'BR', postalCode: '1', state: 'SP', city: 'SP', line1: 'x' },
    items: [{ productId: product.id, variantId: product.variants[0]!.id, quantity: 99 }],
    locale: 'pt',
  })).rejects.toBeInstanceOf(CreateOrderError);
});

it('rejects unknown product', async () => {
  await expect(useCase.execute({
    contact: { name: 'Y', email: 'y@a.com', phone: '1' },
    address: { country: 'BR', postalCode: '1', state: 'SP', city: 'SP', line1: 'x' },
    items: [{ productId: 'nope', variantId: 'nope', quantity: 1 }],
    locale: 'pt',
  })).rejects.toBeInstanceOf(CreateOrderError);
});
