import { randomUUID } from 'node:crypto';
import type { DatabaseSync } from 'node:sqlite';
import type { Product, ProductInput, ProductRepository } from '../../domain/product.js';

interface ProductRow { doc: string }

export class SqliteProductRepository implements ProductRepository {
  constructor(private readonly db: DatabaseSync) {}

  async listActive(): Promise<Product[]> {
    const rows = this.db
      .prepare(`SELECT doc FROM products WHERE active = 1 ORDER BY json_extract(doc, '$.name.en') ASC`)
      .all() as unknown as ProductRow[];
    return rows.map(rowToProduct);
  }

  async listAll(): Promise<Product[]> {
    const rows = this.db
      .prepare(`SELECT doc FROM products ORDER BY json_extract(doc, '$.name.en') ASC`)
      .all() as unknown as ProductRow[];
    return rows.map(rowToProduct);
  }

  async findById(id: string): Promise<Product | null> {
    const row = this.db.prepare(`SELECT doc FROM products WHERE id = ?`).get(id) as ProductRow | undefined;
    return row ? rowToProduct(row) : null;
  }

  async findActiveById(id: string): Promise<Product | null> {
    const row = this.db.prepare(`SELECT doc FROM products WHERE id = ? AND active = 1`).get(id) as ProductRow | undefined;
    return row ? rowToProduct(row) : null;
  }

  async create(input: ProductInput): Promise<Product> {
    const now = new Date();
    const product: Product = {
      id: randomUUID(),
      name: input.name,
      description: input.description,
      imageUrl: input.imageUrl,
      variants: input.variants.map(variant => ({
        id: variant.id || randomUUID(),
        sku: variant.sku,
        attributes: variant.attributes,
        prices: variant.prices,
        stock: variant.stock,
        active: variant.active ?? true,
      })),
      active: input.active ?? true,
      createdAt: now,
      updatedAt: now,
    };
    this.insert(product);
    return product;
  }

  async update(id: string, input: ProductInput): Promise<Product | null> {
    const existing = await this.findById(id);
    if (!existing) return null;
    const product: Product = {
      ...existing,
      name: input.name,
      description: input.description,
      imageUrl: input.imageUrl,
      variants: input.variants.map(variant => ({
        id: variant.id ?? randomUUID(),
        sku: variant.sku,
        attributes: variant.attributes,
        prices: variant.prices,
        stock: variant.stock,
        active: variant.active ?? true,
      })),
      active: input.active ?? existing.active,
      updatedAt: new Date(),
    };
    this.db
      .prepare(`UPDATE products SET doc = ?, active = ?, updated_at = ? WHERE id = ?`)
      .run(JSON.stringify(product), product.active ? 1 : 0, product.updatedAt.toISOString(), id);
    return product;
  }

  async seedIfEmpty(products: Product[]): Promise<void> {
    const count = (this.db.prepare(`SELECT COUNT(*) AS n FROM products`).get() as { n: number }).n;
    if (count > 0) return;
    this.db.exec('BEGIN');
    try {
      for (const item of products) this.insert(item);
      this.db.exec('COMMIT');
    } catch (error) {
      this.db.exec('ROLLBACK');
      throw error;
    }
  }

  async decrementStock(productId: string, variantId: string, quantity: number): Promise<void> {
    const row = this.db.prepare(`SELECT doc FROM products WHERE id = ?`).get(productId) as ProductRow | undefined;
    if (!row) throw new Error('INSUFFICIENT_STOCK_OR_NOT_FOUND');
    const product = rowToProduct(row);
    const variant = product.variants.find(item => item.id === variantId);
    if (!variant || variant.stock < quantity) throw new Error('INSUFFICIENT_STOCK_OR_NOT_FOUND');
    variant.stock -= quantity;
    product.updatedAt = new Date();
    this.db
      .prepare(`UPDATE products SET doc = ?, updated_at = ? WHERE id = ?`)
      .run(JSON.stringify(product), product.updatedAt.toISOString(), productId);
  }

  private insert(product: Product): void {
    this.db
      .prepare(`INSERT INTO products (id, doc, active, updated_at) VALUES (?, ?, ?, ?)`)
      .run(product.id, JSON.stringify(product), product.active ? 1 : 0, product.updatedAt.toISOString());
  }
}

function rowToProduct(row: ProductRow): Product {
  const parsed = JSON.parse(row.doc) as Product;
  return { ...parsed, createdAt: new Date(parsed.createdAt), updatedAt: new Date(parsed.updatedAt) };
}
