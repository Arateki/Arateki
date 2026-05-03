import type { Product, ProductInput, ProductRepository } from '../domain/product.js';
import type { AuditLogRepository } from '../domain/audit-log.js';

export class UpdateProductError extends Error {
  constructor(readonly code: 'PRODUCT_NOT_FOUND') {
    super(code);
  }
}

export class UpdateProductUseCase {
  constructor(
    private readonly products: ProductRepository,
    private readonly auditLogs?: AuditLogRepository,
  ) {}

  async execute(id: string, input: ProductInput, userId?: string): Promise<Product> {
    const before = await this.products.findById(id);
    if (!before) {
      throw new UpdateProductError('PRODUCT_NOT_FOUND');
    }

    const product = await this.products.update(id, input);
    if (!product) {
      throw new UpdateProductError('PRODUCT_NOT_FOUND');
    }

    if (userId && this.auditLogs) {
      await this.auditLogs.record({
        userId,
        action: 'product.update',
        entityType: 'product',
        entityId: product.id,
        before,
        after: product,
      });
    }

    return product;
  }
}
