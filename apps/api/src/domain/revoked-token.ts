export interface RevokedToken {
  id: string;
  expiresAt: Date;
  createdAt: Date;
}

export interface RevokedTokenRepository {
  revoke(input: RevokedToken): Promise<void>;
  isRevoked(id: string): Promise<boolean>;
  ensureIndexes(): Promise<void>;
}
