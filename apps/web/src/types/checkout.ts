export type OrderStatus = 'pending' | 'paid' | 'processing' | 'shipped' | 'cancelled';

export interface ContactData {
  name: string;
  email: string;
  phone: string;
}

export interface DeliveryData {
  cep: string;
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
  shippingMethod: 'pac' | 'sedex' | '';
}

export interface PaymentData {
  method: 'pix' | 'credit_card' | '';
}

export interface CheckoutFormData {
  contact: ContactData;
  delivery: DeliveryData;
  payment: PaymentData;
}

export interface ShippingOption {
  id: 'pac' | 'sedex';
  name: string;
  description: string;
  price: number;
  days: string;
}

export const SHIPPING_OPTIONS: ShippingOption[] = [
  { id: 'pac',   name: 'PAC',   description: 'Correios PAC',   price: 18.90, days: '8–12 dias úteis' },
  { id: 'sedex', name: 'SEDEX', description: 'Correios SEDEX', price: 42.50, days: '2–4 dias úteis'  },
];
