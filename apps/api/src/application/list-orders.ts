import type { Order, OrderRepository } from '../domain/order.js';

export class ListOrdersUseCase {
  constructor(private readonly orders: OrderRepository) {}

  async execute(): Promise<Order[]> {
    return this.orders.listAll();
  }
}
