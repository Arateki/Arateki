import { describe, it, expect, vi, beforeEach } from 'vitest';
import { productService } from './productService';

describe('productService', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('should fetch products and map them correctly', async () => {
    const mockApiResponse = {
      products: [
        {
          id: 'p1',
          name: 'Name PT',
          description: 'Desc PT',
          priceCents: 1000,
          currency: 'BRL',
          imageUrl: 'image-url',
          variants: [{ id: 'v1' }]
        }
      ]
    };

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockApiResponse,
    }));

    const products = await productService.getProducts('pt', 'BR');

    expect(products).toHaveLength(1);
    expect(products[0]).toEqual({
      id: 'p1',
      name: 'Name PT',
      description: 'Desc PT',
      price: 10,
      currency: 'BRL',
      image: 'image-url',
      category: 'Componentes',
      variantId: 'v1'
    });
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/products?lang=pt&country=BR'));
  });

  it('should use default image if imageUrl is missing', async () => {
    const mockApiResponse = {
      products: [
        {
          id: 'p1',
          name: 'Name',
          description: 'Desc',
          priceCents: 1000,
          currency: 'USD',
          variants: [{ id: 'v1' }]
        }
      ]
    };

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockApiResponse,
    }));

    const products = await productService.getProducts('en', 'US');
    expect(products[0].image).toBeDefined();
    expect(products[0].image).toContain('unsplash');
  });

  it('should throw error on failed fetch', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
    }));

    await expect(productService.getProducts()).rejects.toThrow('Failed to fetch products');
  });
});
