import { randomUUID } from 'node:crypto';
import type { MongoClient } from 'mongodb';
import type { CreateOrderInput, Order, OrderRepository } from '../domain/order.js';
import type { Currency, Product, ProductRepository, ProductVariant } from '../domain/product.js';

export type CreateOrderErrorCode = 'PRODUCT_NOT_FOUND' | 'VARIANT_NOT_FOUND' | 'INSUFFICIENT_STOCK';

export class CreateOrderError extends Error {
  constructor(
    readonly code: CreateOrderErrorCode,
    readonly details: Record<string, string | number>,
  ) {
    super(code);
  }
}

export class CreateOrderUseCase {
  constructor(
    private readonly orders: OrderRepository,
    private readonly products: ProductRepository,
    private readonly mongoClient: MongoClient,
  ) {}

  async execute(input: CreateOrderInput): Promise<Order> {
    const session = this.mongoClient.startSession();

    try {
      return await session.withTransaction(async () => {
        const currency = currencyFromCountry(input.address.country);
        
        // Fetch and validate items within the transaction
        const items = await Promise.all(
          input.items.map(async item => {
            const product = await this.products.findActiveById(item.productId, session);
            if (!product) {
              throw new CreateOrderError('PRODUCT_NOT_FOUND', { productId: item.productId });
            }

            const variant = product.variants.find(
              currentVariant => currentVariant.id === item.variantId && currentVariant.active,
            );
            
            if (!variant) {
              throw new CreateOrderError('VARIANT_NOT_FOUND', {
                productId: item.productId,
                variantId: item.variantId,
              });
            }

            if (variant.stock < item.quantity) {
              throw new CreateOrderError('INSUFFICIENT_STOCK', {
                productId: item.productId,
                variantId: item.variantId,
                availableStock: variant.stock,
              });
            }

            // Decrement stock immediately to lock the document or fail if insufficient
            // The withTransaction will handle WriteConflicts
            await this.products.decrementStock(item.productId, item.variantId, item.quantity, session);

            return toOrderItem(product, variant, item.quantity, currency, input.locale);
          }),
        );

        const now = new Date();
        const order: Order = {
          id: randomUUID(),
          status: 'pending',
          contact: input.contact,
          address: {
            ...input.address,
            country: input.address.country.toUpperCase(),
          },
          items,
          currency,
          totalCents: items.reduce((sum, item) => sum + item.subtotalCents, 0),
          createdAt: now,
          updatedAt: now,
        };

        return this.orders.create(order, session);
      });
    } finally {
      await session.endSession();
    }
  }
}

function currencyFromCountry(country: string): Currency {
  return country.toUpperCase() === 'BR' ? 'BRL' : 'USD';
}

function toOrderItem(
  product: Product,
  variant: ProductVariant,
  quantity: number,
  currency: Currency,
  locale: CreateOrderInput['locale'],
) {
  const unitPriceCents = currency === 'BRL' ? variant.prices.brlCents : variant.prices.usdCents;

  return {
    productId: product.id,
    variantId: variant.id,
    sku: variant.sku,
    name: product.name[locale] || product.name.en,
    quantity,
    unitPriceCents,
    subtotalCents: unitPriceCents * quantity,
  };
}
