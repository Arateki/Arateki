import type { FastifyReply, FastifyRequest } from 'fastify';
import type { RevokedTokenRepository } from '../domain/revoked-token.js';
import type { UserRepository, UserRole } from '../domain/user.js';

export interface AuthJwtPayload {
  sub?: string;
  role?: UserRole;
  tokenVersion?: number;
  jti?: string;
  exp?: number;
}

export interface AuthenticatedAdmin {
  userId: string;
  role: 'admin';
  tokenVersion: number;
  tokenId: string;
  expiresAt: Date;
}

export async function authenticateAdmin(
  request: FastifyRequest,
  reply: FastifyReply,
  users: UserRepository,
  revokedTokens: RevokedTokenRepository,
): Promise<AuthenticatedAdmin | null> {
  try {
    const payload = await request.jwtVerify<AuthJwtPayload>();
    if (
      !payload.sub ||
      payload.role !== 'admin' ||
      typeof payload.tokenVersion !== 'number' ||
      !payload.jti ||
      typeof payload.exp !== 'number'
    ) {
      await reply.code(401).send({ message: 'Invalid or missing token' });
      return null;
    }

    if (await revokedTokens.isRevoked(payload.jti)) {
      await reply.code(401).send({ message: 'Token has been revoked' });
      return null;
    }

    const user = await users.findById(payload.sub);
    if (!user || user.role !== 'admin' || user.tokenVersion !== payload.tokenVersion) {
      await reply.code(403).send({ message: 'Admin role required' });
      return null;
    }

    return {
      userId: payload.sub,
      role: 'admin',
      tokenVersion: payload.tokenVersion,
      tokenId: payload.jti,
      expiresAt: new Date(payload.exp * 1000),
    };
  } catch {
    await reply.code(401).send({ message: 'Invalid or missing token' });
    return null;
  }
}
