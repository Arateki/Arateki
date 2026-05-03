import { describe, it, expect, vi, beforeEach } from 'vitest';
import { checkoutService, type OrderPayload } from './checkoutService';

interface ParsedOrderRequest {
  items: Array<{
    productId: string;
    variantId: string;
    quantity: number;
  }>;
}

describe('checkoutService', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  const mockPayload: OrderPayload = {
    contact: { name: 'Test', email: 'test@test.com', phone: '123456' },
    delivery: { 
      cep: '12345', 
      street: 'Street', 
      number: '10', 
      complement: 'Apt 1', 
      neighborhood: 'NB', 
      city: 'City', 
      state: 'ST',
      shippingMethod: 'pac'
    },
    payment: { method: 'pix' },
    items: [
      {
        product: { id: 'p1', variantId: 'v1', name: 'Product', description: 'Description', price: 10, currency: 'BRL', image: '', category: '' },
        quantity: 2
      }
    ]
  };

  it('should create order successfully and return orderId', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ order: { id: 'order-123' } }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const result = await checkoutService.createOrder(mockPayload);

    expect(result.orderId).toBe('order-123');
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/orders'), expect.objectContaining({
      method: 'POST',
      body: expect.stringContaining('"productId":"p1"'),
    }));
    
    const requestInit = fetchMock.mock.calls[0]?.[1];
    if (!requestInit || typeof requestInit.body !== 'string') {
      throw new Error('Expected createOrder to send a JSON request body');
    }
    const body = JSON.parse(requestInit.body) as ParsedOrderRequest;
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

    await expect(checkoutService.createOrder(mockPayload)).rejects.toThrow('STOCK_INSUFFICIENT');
  });

  it('should throw default error on failure if no message in response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({}),
    }));

    await expect(checkoutService.createOrder(mockPayload)).rejects.toThrow('Failed to create order');
  });
});
