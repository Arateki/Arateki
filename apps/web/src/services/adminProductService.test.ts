import { describe, it, expect, vi, beforeEach } from 'vitest';
import { adminProductService, type RawProduct, type RawProductInput } from './adminProductService';

describe('adminProductService', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  const mockProduct: RawProduct = {
    id: 'p1',
    name: { pt: 'Nome', en: 'Name', es: 'Nombre', zh: '名称', ja: '名前' },
    description: { pt: 'Desc', en: 'Desc', es: 'Desc', zh: '描述', ja: '説明' },
    variants: [],
    active: true
  };

  const mockProductInput: RawProductInput = {
    name: mockProduct.name,
    description: mockProduct.description,
    variants: [],
    active: true,
  };

  it('should get admin products', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ products: [mockProduct] }),
    }));

    const products = await adminProductService.getProducts('token');

    expect(products).toHaveLength(1);
    expect(products[0].id).toBe('p1');
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/admin/products'), expect.any(Object));
  });

  it('should create product', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ product: mockProduct }),
    }));

    const result = await adminProductService.createProduct('token', mockProductInput);

    expect(result.id).toBe('p1');
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/products'), expect.objectContaining({
      method: 'POST',
      body: JSON.stringify(mockProductInput)
    }));
  });

  it('should get one admin product', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ product: mockProduct }),
    }));

    const product = await adminProductService.getProduct('token', 'p1');

    expect(product.id).toBe('p1');
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/admin/products/p1'), expect.any(Object));
  });

  it('should update product', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ product: mockProduct }),
    }));

    const result = await adminProductService.updateProduct('token', 'p1', mockProductInput);

    expect(result.id).toBe('p1');
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/products/p1'), expect.objectContaining({
      method: 'PUT'
    }));
  });

  it('should throw error on failure', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
    }));

    await expect(adminProductService.getProducts('token')).rejects.toThrow('Failed to fetch products');
  });
});
