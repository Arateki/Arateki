import type { Order, OrderRepository } from '../domain/order.js';

export class GetOrderUseCase {
  constructor(private readonly orders: OrderRepository) {}

  async execute(id: string): Promise<Order | null> {
    return this.orders.findById(id);
  }
}
