import type { Collection, Db } from 'mongodb';
import type { RevokedToken, RevokedTokenRepository } from '../domain/revoked-token.js';

interface RevokedTokenDocument extends Omit<RevokedToken, 'id'> {
  _id: string;
}

export class MongoRevokedTokenRepository implements RevokedTokenRepository {
  private readonly collection: Collection<RevokedTokenDocument>;

  constructor(db: Db) {
    this.collection = db.collection<RevokedTokenDocument>('revokedTokens');
  }

  async revoke(input: RevokedToken): Promise<void> {
    await this.collection.updateOne(
      { _id: input.id },
      { $setOnInsert: toDocument(input) },
      { upsert: true },
    );
  }

  async isRevoked(id: string): Promise<boolean> {
    return (await this.collection.countDocuments({ _id: id }, { limit: 1 })) > 0;
  }

  async ensureIndexes(): Promise<void> {
    await this.collection.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
  }
}

function toDocument(token: RevokedToken): RevokedTokenDocument {
  const { id, ...rest } = token;
  return { _id: id, ...rest };
}
