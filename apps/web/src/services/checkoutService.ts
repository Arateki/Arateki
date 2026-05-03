import type { CheckoutFormData } from '../types/checkout';
import type { CartItem } from '../context/CartContext';

export interface OrderPayload extends CheckoutFormData {
  items: CartItem[];
}

export interface OrderResponse {
  orderId: string;
}

const API_URL = import.meta.env.VITE_API_URL || '/api';

export const checkoutService = {
  async createOrder(payload: OrderPayload): Promise<OrderResponse> {
    const supportedLangs = ['pt', 'en', 'es', 'zh', 'ja'];
    const sysLang = navigator.language.split('-')[0];
    const lang = supportedLangs.includes(sysLang) ? sysLang : 'en';

    const formattedPayload = {
      lang,
      contact: {
        name: payload.contact.name,
        email: payload.contact.email,
        phone: payload.contact.phone,
      },
      address: {
        country: 'BR', // Currently assuming BR for checkout, or extract from user location
        postalCode: payload.delivery.cep,
        state: payload.delivery.state,
        city: payload.delivery.city,
        line1: `${payload.delivery.street}, ${payload.delivery.number}`,
        line2: payload.delivery.complement || undefined,
      },
      items: payload.items.map(item => ({
        productId: item.product.id,
        variantId: item.product.variantId,
        quantity: item.quantity,
      })),
    };

    const response = await fetch(`${API_URL}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formattedPayload),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to create order');
    }

    const data = await response.json();
    return { orderId: data.order.id };
  },
};
