import { randomUUID } from 'node:crypto';
import type { FastifyInstance } from 'fastify';
import type { ChangePasswordUseCase } from '../application/change-password.js';
import type { LoginUseCase } from '../application/login.js';
import type { RevokeTokenUseCase } from '../application/revoke-token.js';
import type { RevokedTokenRepository } from '../domain/revoked-token.js';
import type { UserRepository } from '../domain/user.js';
import { authenticateAdmin } from './auth.js';
import { changePasswordBodySchema, loginBodySchema } from './schemas.js';

interface AuthRoutesDependencies {
  login: LoginUseCase;
  changePassword: ChangePasswordUseCase;
  revokeToken: RevokeTokenUseCase;
  users: UserRepository;
  revokedTokens: RevokedTokenRepository;
}

export async function registerAuthRoutes(
  app: FastifyInstance,
  dependencies: AuthRoutesDependencies,
): Promise<void> {
  const signAdminToken = (userId: string, tokenVersion: number) => app.jwt.sign({
    jti: randomUUID(),
    role: 'admin',
    sub: userId,
    tokenVersion,
  });

  app.post('/login', {
    config: {
      rateLimit: {
        max: 5,
        timeWindow: '1 minute',
      },
    },
  }, async (request, reply) => {
    const parsedBody = loginBodySchema.safeParse(request.body);
    if (!parsedBody.success) {
      return reply.code(400).send({
        message: 'Invalid login payload',
        issues: parsedBody.error.flatten().fieldErrors,
      });
    }

    const user = await dependencies.login.execute(parsedBody.data);
    if (!user) {
      return reply.code(401).send({ message: 'Invalid credentials' });
    }

    const token = signAdminToken(user.id, user.tokenVersion);

    return { token };
  });

  app.get('/me', async (request, reply) => {
    const admin = await authenticateAdmin(
      request,
      reply,
      dependencies.users,
      dependencies.revokedTokens,
    );
    if (!admin) return reply;

    return {
      user: {
        id: admin.userId,
        role: admin.role,
      },
    };
  });

  app.post('/refresh', async (request, reply) => {
    const admin = await authenticateAdmin(
      request,
      reply,
      dependencies.users,
      dependencies.revokedTokens,
    );
    if (!admin) return reply;

    await dependencies.revokeToken.execute({
      id: admin.tokenId,
      expiresAt: admin.expiresAt,
    });

    return {
      token: signAdminToken(admin.userId, admin.tokenVersion),
    };
  });

  app.post('/logout', async (request, reply) => {
    const admin = await authenticateAdmin(
      request,
      reply,
      dependencies.users,
      dependencies.revokedTokens,
    );
    if (!admin) return reply;

    await dependencies.revokeToken.execute({
      id: admin.tokenId,
      expiresAt: admin.expiresAt,
    });

    return reply.code(204).send();
  });

  app.patch('/users/password', async (request, reply) => {
    const admin = await authenticateAdmin(
      request,
      reply,
      dependencies.users,
      dependencies.revokedTokens,
    );
    if (!admin) return reply;

    const parsedBody = changePasswordBodySchema.safeParse(request.body);
    if (!parsedBody.success) {
      return reply.code(400).send({
        message: 'Invalid password payload',
        issues: parsedBody.error.flatten().fieldErrors,
      });
    }

    const updatedUser = await dependencies.changePassword.execute({
      userId: admin.userId,
      ...parsedBody.data,
    });

    if (!updatedUser) {
      return reply.code(401).send({ message: 'Invalid credentials' });
    }

    await dependencies.revokeToken.execute({
      id: admin.tokenId,
      expiresAt: admin.expiresAt,
    });

    return reply.code(204).send();
  });
}
