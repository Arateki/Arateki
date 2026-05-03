import { randomUUID } from 'node:crypto';
import type { Collection, Db } from 'mongodb';
import type { AuditLog, AuditLogInput, AuditLogRepository } from '../domain/audit-log.js';

interface AuditLogDocument extends Omit<AuditLog, 'id'> {
  _id: string;
}

export class MongoAuditLogRepository implements AuditLogRepository {
  private readonly collection: Collection<AuditLogDocument>;

  constructor(db: Db) {
    this.collection = db.collection<AuditLogDocument>('audit_logs');
  }

  async record(input: AuditLogInput): Promise<void> {
    const entry: AuditLog = {
      id: randomUUID(),
      ...input,
      at: new Date(),
    };

    await this.collection.insertOne(toDocument(entry));
  }

  async ensureIndexes(): Promise<void> {
    await this.collection.createIndex({ entityId: 1, at: -1 });
    await this.collection.createIndex({ userId: 1, at: -1 });
    await this.collection.createIndex({ action: 1, at: -1 });
  }
}

function toDocument(entry: AuditLog): AuditLogDocument {
  const { id, ...rest } = entry;
  return { _id: id, ...rest };
}
