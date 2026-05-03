export type AuditAction =
  | 'product.create'
  | 'product.update'
  | 'order.status.update'
  | 'user.password.change';

export type AuditEntityType = 'product' | 'order' | 'user';

export interface AuditLog {
  id: string;
  userId: string;
  action: AuditAction;
  entityType: AuditEntityType;
  entityId: string;
  before?: unknown;
  after?: unknown;
  at: Date;
}

export type AuditLogInput = Omit<AuditLog, 'id' | 'at'>;

export interface AuditLogRepository {
  record(entry: AuditLogInput): Promise<void>;
}
