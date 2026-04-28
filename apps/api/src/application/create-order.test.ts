import { describe, expect, it } from 'vitest';
import type { MongoClient } from 'mongodb';
import { defaultProducts } from '../config/default-products.js';
import type { Order, OrderRepository } from '../domain/order.js';
import type { Product, ProductInput, ProductRepository } from '../domain/product.js';
import { CreateOrderError, CreateOrderUseCase } from './create-order.js';

class InMemoryOrderRepository implements OrderRepository {
  readonly orders: Order[] = [];

  create(order: Order): Promise<Order> {
    this.orders.push(order);
    return Promise.resolve(order);
  }

  ensureIndexes(): Promise<void> {
    return Promise.resolve();
  }
}

class InMemoryProductRepository implements ProductRepository {
  constructor(private readonly products: Product[]) {}

  listActive(): Promise<Product[]> {
    return Promise.resolve(this.products.filter(product => product.active));
  }

  findActiveById(id: string): Promise<Product | null> {
    return Promise.resolve(this.products.find(product => product.id === id && product.active) ?? null);
  }

  create(input: ProductInput): Promise<Product> {
    const now = new Date();
    const product: Product = {
      id: 'new-product',
      active: input.active ?? true,
      createdAt: now,
      updatedAt: now,
      ...input,
      variants: input.variants.map((variant, index) => ({
        id: `variant-${index + 1}`,
        active: variant.active ?? true,
        ...variant,
      })),
    };
    this.products.push(product);
    return Promise.resolve(product);
  }

  seedIfEmpty(products: Product[]): Promise<void> {
    if (this.products.length === 0) this.products.push(...products);
    return Promise.resolve();
  }

  decrementStock(productId: string, variantId: string, quantity: number): Promise<void> {
    const product = this.products.find(p => p.id === productId);
    if (!product) throw new Error('INSUFFICIENT_STOCK_OR_NOT_FOUND');
    
    const variant = product.variants.find(v => v.id === variantId);
    if (!variant || variant.stock < quantity) throw new Error('INSUFFICIENT_STOCK_OR_NOT_FOUND');
    
    variant.stock -= quantity;
    return Promise.resolve();
  }
}

const mockMongoClient = {
  startSession: () => ({
    withTransaction: <T>(callback: () => Promise<T>) => callback(),
    endSession: () => Promise.resolve(),
  }),
} as unknown as MongoClient;

describe('CreateOrderUseCase', () => {
  it('creates a pending order with server-side product snapshots', async () => {
    const orderRepository = new InMemoryOrderRepository();
    const useCase = new CreateOrderUseCase(
      orderRepository,
      new InMemoryProductRepository([...JSON.parse(JSON.stringify(defaultProducts))]),
      mockMongoClient
    );

    const order = await useCase.execute({
      locale: 'pt',
      contact: {
        name: 'Maria Silva',
        email: 'maria@example.com',
        phone: '+5511999999999',
      },
      address: {
        country: 'br',
        postalCode: '01001-000',
        state: 'SP',
        city: 'Sao Paulo',
        line1: 'Rua Exemplo, 123',
      },
      items: [
        {
          productId: 'esp32-wroom-32d',
          variantId: 'esp32-wroom-32d-default',
          quantity: 2,
        },
      ],
    });

    expect(order).toMatchObject({
      status: 'pending',
      currency: 'BRL',
      totalCents: 9180,
      address: {
        country: 'BR',
      },
      items: [
        {
          productId: 'esp32-wroom-32d',
          variantId: 'esp32-wroom-32d-default',
          sku: 'ESP32-WROOM-32D',
          name: 'ESP32-WROOM-32D',
          quantity: 2,
          unitPriceCents: 4590,
          subtotalCents: 9180,
        },
      ],
    });
    expect(orderRepository.orders).toHaveLength(1);
  });

  it('rejects unavailable stock', async () => {
    const useCase = new CreateOrderUseCase(
      new InMemoryOrderRepository(),
      new InMemoryProductRepository([...defaultProducts]),
      mockMongoClient
    );

    await expect(
      useCase.execute({
        locale: 'en',
        contact: {
          name: 'John Doe',
          email: 'john@example.com',
          phone: '+15555555555',
        },
        address: {
          country: 'US',
          postalCode: '10001',
          state: 'NY',
          city: 'New York',
          line1: '1 Example St',
        },
        items: [
          {
            productId: 'esp32-wroom-32d',
            variantId: 'esp32-wroom-32d-default',
            quantity: 999,
          },
        ],
      }),
    ).rejects.toBeInstanceOf(CreateOrderError);
  });
});
