import type { Product, ProductInput, ProductRepository } from '../domain/product.js';
import type { AuditLogRepository } from '../domain/audit-log.js';

export class CreateProductUseCase {
  constructor(
    private readonly products: ProductRepository,
    private readonly auditLogs?: AuditLogRepository,
  ) {}

  async execute(input: ProductInput, userId?: string): Promise<Product> {
    const product = await this.products.create(input);

    if (userId && this.auditLogs) {
      await this.auditLogs.record({
        userId,
        action: 'product.create',
        entityType: 'product',
        entityId: product.id,
        after: product,
      });
    }

    return product;
  }
}
