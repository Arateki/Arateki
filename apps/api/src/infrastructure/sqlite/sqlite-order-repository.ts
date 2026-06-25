import type { DatabaseSync } from 'node:sqlite';
import type { Order, OrderRepository, OrderStatus } from '../../domain/order.js';

interface OrderRow { doc: string }

export class SqliteOrderRepository implements OrderRepository {
  constructor(private readonly db: DatabaseSync) {}

  async create(order: Order): Promise<Order> {
    this.db
      .prepare(`INSERT INTO orders (id, doc, status, contact_email, created_at) VALUES (?, ?, ?, ?, ?)`)
      .run(order.id, JSON.stringify(order), order.status, order.contact.email, order.createdAt.toISOString());
    return order;
  }

  async findById(id: string): Promise<Order | null> {
    const row = this.db.prepare(`SELECT doc FROM orders WHERE id = ?`).get(id) as OrderRow | undefined;
    return row ? rowToOrder(row) : null;
  }

  async listAll(): Promise<Order[]> {
    const rows = this.db.prepare(`SELECT doc FROM orders ORDER BY created_at DESC`).all() as OrderRow[];
    return rows.map(rowToOrder);
  }

  async updateStatus(id: string, status: OrderStatus): Promise<boolean> {
    const existing = await this.findById(id);
    if (!existing) return false;
    const updated: Order = { ...existing, status, updatedAt: new Date() };
    this.db.prepare(`UPDATE orders SET doc = ?, status = ? WHERE id = ?`).run(JSON.stringify(updated), status, id);
    return true;
  }

  async ensureIndexes(): Promise<void> {
    // índices criados no schema; método mantido por compatibilidade da interface
  }
}

function rowToOrder(row: OrderRow): Order {
  const parsed = JSON.parse(row.doc) as Order;
  return { ...parsed, createdAt: new Date(parsed.createdAt), updatedAt: new Date(parsed.updatedAt) };
}
