import { describe, expect, it } from 'vitest';
import type { Product, ProductRepository } from '../domain/product.js';
import { GetAdminProductUseCase } from './get-admin-product.js';

const buildProduct = (id: string, active = true): Product => ({
  id,
  name: { pt: 'Sonda', en: 'Probe', es: 'Sonda', zh: '探头', ja: 'プローブ' },
  description: { pt: 'Desc', en: 'Desc', es: 'Desc', zh: '描述', ja: '説明' },
  variants: [],
  active,
  createdAt: new Date(),
  updatedAt: new Date(),
});

class StubProductRepository implements ProductRepository {
  constructor(private readonly products: Product[]) {}

  listActive(): Promise<Product[]> {
    return Promise.resolve(this.products.filter(p => p.active));
  }

  listAll(): Promise<Product[]> {
    return Promise.resolve(this.products);
  }

  findActiveById(id: string): Promise<Product | null> {
    return Promise.resolve(this.products.find(p => p.id === id && p.active) ?? null);
  }

  findById(id: string): Promise<Product | null> {
    return Promise.resolve(this.products.find(p => p.id === id) ?? null);
  }

  create(): Promise<Product> {
    throw new Error('not implemented');
  }

  update(): Promise<Product | null> {
    return Promise.resolve(null);
  }

  seedIfEmpty(): Promise<void> {
    return Promise.resolve();
  }

  decrementStock(): Promise<void> {
    return Promise.resolve();
  }
}

describe('GetAdminProductUseCase', () => {
  it('returns the product when it exists', async () => {
    const product = buildProduct('p-1');
    const useCase = new GetAdminProductUseCase(new StubProductRepository([product]));

    expect(await useCase.execute('p-1')).toEqual(product);
  });

  it('returns null when the product does not exist', async () => {
    const useCase = new GetAdminProductUseCase(new StubProductRepository([]));

    expect(await useCase.execute('missing')).toBeNull();
  });

  it('returns inactive products as well (admin sees all)', async () => {
    const inactive = buildProduct('p-2', false);
    const useCase = new GetAdminProductUseCase(new StubProductRepository([inactive]));

    const result = await useCase.execute('p-2');
    expect(result?.active).toBe(false);
  });
});
