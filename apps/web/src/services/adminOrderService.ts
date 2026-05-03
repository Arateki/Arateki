import type { OrderStatus } from '../types/checkout';

// Mirroring the backend Order type approximately for the admin dashboard
export interface AdminOrder {
  id: string;
  status: OrderStatus;
  contact: {
    name: string;
    email: string;
    phone: string;
  };
  totalCents: number;
  currency: string;
  createdAt: string;
  updatedAt: string;
  items: Array<{
    productId: string;
    name: string;
    quantity: number;
  }>;
}

const API_URL = import.meta.env.VITE_API_URL || '/api';

export const adminOrderService = {
  async getOrders(token: string): Promise<AdminOrder[]> {
    const response = await fetch(`${API_URL}/orders`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch orders');
    }

    const data = await response.json();
    return data.orders;
  },

  async updateOrderStatus(token: string, orderId: string, status: OrderStatus): Promise<void> {
    const response = await fetch(`${API_URL}/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ status })
    });

    if (!response.ok) {
      throw new Error('Failed to update order status');
    }
  }
};
