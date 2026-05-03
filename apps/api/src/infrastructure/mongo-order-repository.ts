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
    await this.collection.insertOne(toDocument(order), session ? { session } : undefined);
    return order;
  }

  async findById(id: string): Promise<Order | null> {
    const document = await this.collection.findOne({ _id: id });
    return document ? toOrder(document) : null;
  }

  async listAll(): Promise<Order[]> {
    const documents = await this.collection
      .find()
      .sort({ createdAt: -1 })
      .toArray();

    return documents.map(toOrder);
  }

  async updateStatus(id: string, status: import('../domain/order.js').OrderStatus): Promise<boolean> {
    const result = await this.collection.updateOne(
      { _id: id },
      {
        $set: {
          status,
          updatedAt: new Date(),
        }
      }
    );
    return result.modifiedCount > 0;
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

function toOrder(document: OrderDocument): Order {
  const { _id, ...rest } = document;
  return { id: _id, ...rest };
}
