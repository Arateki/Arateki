import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { CartProvider } from './CartContext';
import { useCart } from './useCart';
import type { Product } from '../types/product';

const mockProduct: Product = {
  id: 'p1',
  name: 'Test',
  description: 'Desc',
  price: 10,
  currency: 'BRL',
  image: '',
  category: '',
  variantId: 'v1'
};

describe('CartContext', () => {
  it('should add items to cart', () => {
    const { result } = renderHook(() => useCart(), {
      wrapper: CartProvider
    });

    act(() => {
      result.current.addToCart(mockProduct);
    });

    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0].product.id).toBe('p1');
    expect(result.current.totalItems).toBe(1);
    expect(result.current.totalPrice).toBe(10);
  });

  it('should increment quantity if same item is added', () => {
    const { result } = renderHook(() => useCart(), {
      wrapper: CartProvider
    });

    act(() => {
      result.current.addToCart(mockProduct);
      result.current.addToCart(mockProduct);
    });

    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0].quantity).toBe(2);
    expect(result.current.totalPrice).toBe(20);
  });

  it('should update quantity', () => {
    const { result } = renderHook(() => useCart(), {
      wrapper: CartProvider
    });

    act(() => {
      result.current.addToCart(mockProduct);
      result.current.updateQuantity('p1', 5);
    });

    expect(result.current.items[0].quantity).toBe(5);
  });

  it('should remove item if quantity is set to 0', () => {
    const { result } = renderHook(() => useCart(), {
      wrapper: CartProvider
    });

    act(() => {
      result.current.addToCart(mockProduct);
      result.current.updateQuantity('p1', 0);
    });

    expect(result.current.items).toHaveLength(0);
  });

  it('should removeFromCart by id', () => {
    const { result } = renderHook(() => useCart(), {
      wrapper: CartProvider
    });

    act(() => {
      result.current.addToCart(mockProduct);
      result.current.removeFromCart('p1');
    });

    expect(result.current.items).toHaveLength(0);
  });

  it('should clear cart', () => {
    const { result } = renderHook(() => useCart(), {
      wrapper: CartProvider
    });

    act(() => {
      result.current.addToCart(mockProduct);
      result.current.clearCart();
    });

    expect(result.current.items).toHaveLength(0);
  });
});
