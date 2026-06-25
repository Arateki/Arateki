import { randomUUID } from 'node:crypto';
import type { DatabaseSync } from 'node:sqlite';
import type { AuditLog, AuditLogInput, AuditLogRepository } from '../../domain/audit-log.js';

export class SqliteAuditLogRepository implements AuditLogRepository {
  constructor(private readonly db: DatabaseSync) {}

  async record(input: AuditLogInput): Promise<void> {
    const entry: AuditLog = { id: randomUUID(), ...input, at: new Date() };
    this.db
      .prepare(`INSERT INTO audit_logs (id, doc, created_at) VALUES (?, ?, ?)`)
      .run(entry.id, JSON.stringify(entry), entry.at.toISOString());
  }
}
