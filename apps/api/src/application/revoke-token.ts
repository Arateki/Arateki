import type { RevokedTokenRepository } from '../domain/revoked-token.js';

export interface RevokeTokenInput {
  id: string;
  expiresAt: Date;
}

export class RevokeTokenUseCase {
  constructor(private readonly revokedTokens: RevokedTokenRepository) {}

  execute(input: RevokeTokenInput): Promise<void> {
    return this.revokedTokens.revoke({
      ...input,
      createdAt: new Date(),
    });
  }
}
