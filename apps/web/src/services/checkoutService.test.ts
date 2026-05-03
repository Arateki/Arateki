import { describe, it, expect, vi, beforeEach } from 'vitest';
import { checkoutService } from './checkoutService';

describe('checkoutService', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  const mockPayload = {
    contact: { name: 'Test', email: 'test@test.com', phone: '123456' },
    delivery: { 
      cep: '12345', 
      street: 'Street', 
      number: '10', 
      complement: 'Apt 1', 
      neighborhood: 'NB', 
      city: 'City', 
      state: 'ST' 
    },
    payment: { method: 'pix' },
    shipping: { id: 'pac', name: 'PAC', price: 10, days: '5' },
    items: [
      {
        product: { id: 'p1', variantId: 'v1', name: 'Product', price: 10, currency: 'BRL', image: '', category: '' },
        quantity: 2
      }
    ]
  };

  it('should create order successfully and return orderId', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ order: { id: 'order-123' } }),
    }));

    const result = await checkoutService.createOrder(mockPayload as any);

    expect(result.orderId).toBe('order-123');
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/orders'), expect.objectContaining({
      method: 'POST',
      body: expect.stringContaining('"productId":"p1"'),
    }));
    
    const body = JSON.parse((vi.mocked(fetch).mock.calls[0][1] as any).body);
    expect(body.items[0]).toEqual({
      productId: 'p1',
      variantId: 'v1',
      quantity: 2
    });
  });

  it('should throw error with API message on failure', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ message: 'STOCK_INSUFFICIENT' }),
    }));

    await expect(checkoutService.createOrder(mockPayload as any)).rejects.toThrow('STOCK_INSUFFICIENT');
  });

  it('should throw default error on failure if no message in response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({}),
    }));

    await expect(checkoutService.createOrder(mockPayload as any)).rejects.toThrow('Failed to create order');
  });
});
