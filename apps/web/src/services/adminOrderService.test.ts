import { describe, it, expect, vi, beforeEach } from 'vitest';
import { adminOrderService } from './adminOrderService';

describe('adminOrderService', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('should get orders with token', async () => {
    const mockOrders = [{ id: 'o1', status: 'pending' }];
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ orders: mockOrders }),
    }));

    const orders = await adminOrderService.getOrders('token-123');

    expect(orders).toEqual(mockOrders);
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/orders'), expect.objectContaining({
      headers: expect.objectContaining({
        'Authorization': 'Bearer token-123',
      }),
    }));
  });

  it('should update order status', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
    }));

    await adminOrderService.updateOrderStatus('token-123', 'o1', 'paid');

    expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/orders/o1/status'), expect.objectContaining({
      method: 'PATCH',
      body: JSON.stringify({ status: 'paid' }),
      headers: expect.objectContaining({
        'Authorization': 'Bearer token-123',
      }),
    }));
  });

  it('should throw error on failure', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
    }));

    await expect(adminOrderService.getOrders('token')).rejects.toThrow('Failed to fetch orders');
  });
});
