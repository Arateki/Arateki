import { describe, expect, it } from 'vitest';
import { defaultProducts } from '../config/default-products.js';
import type { Product, ProductInput, ProductRepository } from '../domain/product.js';
import { ListProductsUseCase } from './list-products.js';

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
}

describe('ListProductsUseCase', () => {
  it('returns active products from the repository', async () => {
    const products = [
      ...defaultProducts,
      { ...defaultProducts[0], id: 'inactive-product', active: false },
    ];
    const useCase = new ListProductsUseCase(new InMemoryProductRepository(products));

    await expect(useCase.execute({ currency: 'BRL', locale: 'en' })).resolves.toHaveLength(2);
  });

  it('projects products with the selected currency', async () => {
    const useCase = new ListProductsUseCase(new InMemoryProductRepository([...defaultProducts]));

    await expect(useCase.execute({ currency: 'USD', locale: 'pt' })).resolves.toMatchObject([
      {
        id: 'esp32-wroom-32d',
        description: 'Modulo Wi-Fi e Bluetooth para projetos IoT embarcados.',
        priceCents: 899,
        currency: 'USD',
        stock: 25,
        variants: [{ id: 'esp32-wroom-32d-default', priceCents: 899, currency: 'USD' }],
      },
      {
        id: 'sensor-dht22',
        name: 'SENSOR DHT22',
        priceCents: 649,
        currency: 'USD',
        stock: 40,
        variants: [{ id: 'sensor-dht22-default', priceCents: 649, currency: 'USD' }],
      },
    ]);
  });
});
