import type { DatabaseSync } from 'node:sqlite';
import type { RevokedToken, RevokedTokenRepository } from '../../domain/revoked-token.js';

export class SqliteRevokedTokenRepository implements RevokedTokenRepository {
  constructor(private readonly db: DatabaseSync) {}

  async revoke(input: RevokedToken): Promise<void> {
    this.db
      .prepare(`INSERT OR IGNORE INTO revoked_tokens (jti, expires_at) VALUES (?, ?)`)
      .run(input.id, input.expiresAt.toISOString());
  }

  async isRevoked(id: string): Promise<boolean> {
    const row = this.db.prepare(`SELECT 1 FROM revoked_tokens WHERE jti = ? LIMIT 1`).get(id);
    return row !== undefined;
  }

  async purgeExpired(now: Date = new Date()): Promise<number> {
    const result = this.db.prepare(`DELETE FROM revoked_tokens WHERE expires_at < ?`).run(now.toISOString());
    return Number(result.changes);
  }
}
