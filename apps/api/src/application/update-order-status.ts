import type { OrderRepository, OrderStatus } from '../domain/order.js';
import type { AuditLogRepository } from '../domain/audit-log.js';

export class UpdateOrderStatusError extends Error {
  constructor(readonly code: 'ORDER_NOT_FOUND') {
    super(code);
  }
}

export class UpdateOrderStatusUseCase {
  constructor(
    private readonly orders: OrderRepository,
    private readonly auditLogs?: AuditLogRepository,
  ) {}

  async execute(id: string, status: OrderStatus, userId?: string): Promise<void> {
    const before = await this.orders.findById(id);
    if (!before) {
      throw new UpdateOrderStatusError('ORDER_NOT_FOUND');
    }

    const updated = await this.orders.updateStatus(id, status);
    if (!updated) {
      throw new UpdateOrderStatusError('ORDER_NOT_FOUND');
    }

    if (userId && this.auditLogs) {
      await this.auditLogs.record({
        userId,
        action: 'order.status.update',
        entityType: 'order',
        entityId: id,
        before: {
          status: before.status,
          updatedAt: before.updatedAt,
        },
        after: {
          status,
        },
      });
    }
  }
}
