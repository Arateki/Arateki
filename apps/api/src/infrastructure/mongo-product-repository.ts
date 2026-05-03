import { randomUUID } from 'node:crypto';
import type { Collection, Db, ClientSession } from 'mongodb';
import type { Product, ProductInput, ProductRepository } from '../domain/product.js';

interface ProductDocument extends Omit<Product, 'id'> {
  _id: string;
}

export class MongoProductRepository implements ProductRepository {
  private readonly collection: Collection<ProductDocument>;

  constructor(db: Db) {
    this.collection = db.collection<ProductDocument>('products');
  }

  async listActive(): Promise<Product[]> {
    const documents = await this.collection
      .find({ active: true })
      .sort({ 'name.en': 1 })
      .toArray();

    return documents.map(toProduct);
  }

  async listAll(): Promise<Product[]> {
    const documents = await this.collection
      .find()
      .sort({ 'name.en': 1 })
      .toArray();

    return documents.map(toProduct);
  }

  async findActiveById(id: string, session?: ClientSession): Promise<Product | null> {
    const document = await this.collection.findOne({ _id: id, active: true }, session ? { session } : undefined);
    return document ? toProduct(document) : null;
  }

  async findById(id: string, session?: ClientSession): Promise<Product | null> {
    const document = await this.collection.findOne({ _id: id }, session ? { session } : undefined);
    return document ? toProduct(document) : null;
  }

  async create(input: ProductInput): Promise<Product> {
    const now = new Date();
    const product: Product = {
      id: randomUUID(),
      ...input,
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

    await this.collection.insertOne(toDocument(product));
    return product;
  }

  async update(id: string, input: ProductInput): Promise<Product | null> {
    const existing = await this.findById(id);
    if (!existing) return null;

    const now = new Date();
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
      updatedAt: now,
    };

    await this.collection.replaceOne({ _id: id }, toDocument(product));
    return product;
  }

  async seedIfEmpty(products: Product[]): Promise<void> {
    const existingProducts = await this.collection.estimatedDocumentCount();
    if (existingProducts > 0) return;

    await this.collection.insertMany(products.map(toDocument));
  }

  async decrementStock(productId: string, variantId: string, quantity: number, session?: ClientSession): Promise<void> {
    const result = await this.collection.findOneAndUpdate(
      {
        _id: productId,
        'variants.id': variantId,
        'variants.stock': { $gte: quantity },
      },
      {
        $inc: { 'variants.$.stock': -quantity },
        $set: { updatedAt: new Date() },
      },
      session ? { session } : {},
    );

    if (!result) {
      throw new Error('INSUFFICIENT_STOCK_OR_NOT_FOUND');
    }
  }
}

function toDocument(product: Product): ProductDocument {
  const { id, ...rest } = product;
  return { _id: id, ...rest };
}

function toProduct(document: ProductDocument): Product {
  const { _id, ...rest } = document;
  return { id: _id, ...rest };
}
