export interface RevokedToken {
  id: string;
  expiresAt: Date;
  createdAt: Date;
}

export interface RevokedTokenRepository {
  revoke(input: RevokedToken): Promise<void>;
  isRevoked(id: string): Promise<boolean>;
  /**
   * Remove tokens já expirados (limpeza de TTL). Operação de domínio porque
   * nem todo backend tem expiração nativa; retorna a contagem removida.
   */
  purgeExpired(now?: Date): Promise<number>;
}
