import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { useProducts } from './useProducts';
import { productService } from '../services/productService';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <MemoryRouter>{children}</MemoryRouter>
);

describe('useProducts', () => {
  it('should start with loading state and then return products', async () => {
    const mockProducts = [
      { id: '1', name: 'Test Product', description: 'Desc', price: 10, currency: 'BRL', image: '', category: 'Cat', variantId: 'v1', stock: 5 }
    ];

    const spy = vi.spyOn(productService, 'getProducts').mockResolvedValue(mockProducts);

    const { result } = renderHook(() => useProducts(), { wrapper });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.products).toEqual([]);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.products).toEqual(mockProducts);
    expect(result.current.error).toBeNull();

    spy.mockRestore();
  });

  it('should handle errors', async () => {
    const spy = vi.spyOn(productService, 'getProducts').mockRejectedValue(new Error('API Error'));

    const { result } = renderHook(() => useProducts(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBe('Falha ao carregar produtos. Tente novamente mais tarde.');
    expect(result.current.products).toEqual([]);

    spy.mockRestore();
  });
});
