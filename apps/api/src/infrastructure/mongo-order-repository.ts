import type { Collection, Db, ClientSession } from 'mongodb';
import type { Order, OrderRepository } from '../domain/order.js';

interface OrderDocument extends Omit<Order, 'id'> {
  _id: string;
}

export class MongoOrderRepository implements OrderRepository {
  private readonly collection: Collection<OrderDocument>;

  constructor(db: Db) {
    this.collection = db.collection<OrderDocument>('orders');
  }

  async create(order: Order, session?: ClientSession): Promise<Order> {
    await this.collection.insertOne(toDocument(order), { session });
    return order;
  }

  async ensureIndexes(): Promise<void> {
    await this.collection.createIndex({ status: 1, createdAt: -1 });
    await this.collection.createIndex({ 'contact.email': 1, createdAt: -1 });
  }
}

function toDocument(order: Order): OrderDocument {
  const { id, ...rest } = order;
  return { _id: id, ...rest };
}
