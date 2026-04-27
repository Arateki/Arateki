import type { CheckoutFormData } from '../types/checkout';
import type { CartItem } from '../context/CartContext';

export interface OrderPayload extends CheckoutFormData {
  items: CartItem[];
}

export interface OrderResponse {
  orderId: string;
}

export const checkoutService = {
  async createOrder(payload: OrderPayload): Promise<OrderResponse> {
    // TODO: replace with real API call → POST /orders
    console.log('[checkoutService] createOrder payload:', payload);
    return new Promise((resolve) => {
      setTimeout(() => {
        const orderId = `ARK-${Date.now().toString(36).toUpperCase()}`;
        resolve({ orderId });
      }, 1800);
    });
  },
};
