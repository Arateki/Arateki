import { describe, expect, it } from 'vitest';
import type { Product, ProductInput, ProductRepository } from '../domain/product.js';
import { CreateProductUseCase } from './create-product.js';

class InMemoryProductRepository implements ProductRepository {
  readonly products: Product[] = [];

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

describe('CreateProductUseCase', () => {
  it('delegates product creation to the repository', async () => {
    const repository = new InMemoryProductRepository();
    const useCase = new CreateProductUseCase(repository);

    const product = await useCase.execute({
      name: localizedName(),
      description: localizedDescription(),
      variants: [
        {
          sku: 'PH-PROBE-STANDARD',
          attributes: {
            kind: 'standard',
          },
          prices: {
            brlCents: 12990,
            usdCents: 2499,
          },
          stock: 12,
        },
      ],
    });

    expect(product).toMatchObject({
      id: 'new-product',
      name: localizedName(),
      variants: [{ id: 'variant-1', sku: 'PH-PROBE-STANDARD', active: true }],
      active: true,
    });
    expect(repository.products).toHaveLength(1);
  });
});

function localizedName() {
  return {
    pt: 'Sonda de pH',
    en: 'pH Sensor Probe',
    es: 'Sonda de pH',
    zh: 'pH 传感器探头',
    ja: 'pHセンサープローブ',
  };
}

function localizedDescription() {
  return {
    pt: 'Sonda para monitoramento de pH em hidroponia.',
    en: 'Probe for hydroponic pH monitoring.',
    es: 'Sonda para monitoreo de pH en hidroponia.',
    zh: '用于水培 pH 监测的探头。',
    ja: '水耕栽培のpH監視用プローブ。',
  };
}
