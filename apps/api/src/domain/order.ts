import type { Currency, ProductLocale } from './product.js';

export type OrderStatus = 'pending' | 'paid' | 'processing' | 'shipped' | 'cancelled';

export interface OrderContact {
  name: string;
  email: string;
  phone: string;
}

export interface OrderAddress {
  country: string;
  postalCode: string;
  state: string;
  city: string;
  line1: string;
  line2?: string | undefined;
}

export interface OrderItemInput {
  productId: string;
  variantId: string;
  quantity: number;
}

export interface CreateOrderInput {
  contact: OrderContact;
  address: OrderAddress;
  items: OrderItemInput[];
  locale: ProductLocale;
}

export interface OrderItem {
  productId: string;
  variantId: string;
  sku: string;
  name: string;
  quantity: number;
  unitPriceCents: number;
  subtotalCents: number;
}

export interface Order {
  id: string;
  status: OrderStatus;
  contact: OrderContact;
  address: OrderAddress;
  items: OrderItem[];
  currency: Currency;
  totalCents: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderRepository {
  create(order: Order): Promise<Order>;
  findById(id: string): Promise<Order | null>;
  listAll(): Promise<Order[]>;
  updateStatus(id: string, status: OrderStatus): Promise<boolean>;
}
