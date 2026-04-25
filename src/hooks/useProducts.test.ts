import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useProducts } from './useProducts';
import { productService } from '../services/productService';

describe('useProducts', () => {
  it('should start with loading state and then return products', async () => {
    const mockProducts = [
      { id: '1', name: 'Test Product', description: 'Desc', price: 10, currency: 'BRL', image: '', category: 'Cat' }
    ];
    
    // Mock the service
    const spy = vi.spyOn(productService, 'getProducts').mockResolvedValue(mockProducts);

    const { result } = renderHook(() => useProducts());

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

    const { result } = renderHook(() => useProducts());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBe('Falha ao carregar produtos. Tente novamente mais tarde.');
    expect(result.current.products).toEqual([]);

    spy.mockRestore();
  });
});
