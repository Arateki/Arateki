import type { FastifyInstance } from 'fastify';
import { buildApp } from '../app.js';
import { defaultProducts } from '../config/default-products.js';
import { openDatabase, type SqliteConnection } from '../infrastructure/sqlite/sqlite.js';
import { SqliteOrderRepository } from '../infrastructure/sqlite/sqlite-order-repository.js';
import { SqliteProductRepository } from '../infrastructure/sqlite/sqlite-product-repository.js';
import { SqliteAuditLogRepository } from '../infrastructure/sqlite/sqlite-audit-log-repository.js';
import { SqliteRevokedTokenRepository } from '../infrastructure/sqlite/sqlite-revoked-token-repository.js';
import { SqliteUserRepository } from '../infrastructure/sqlite/sqlite-user-repository.js';
import { SqliteTransactionRunner } from '../infrastructure/sqlite/sqlite-transaction-runner.js';

export interface TestApp {
  app: FastifyInstance;
  sqlite: SqliteConnection;
  jwtSecret: string;
  adminUserId: string;
  close(): Promise<void>;
}

export async function createTestApp(): Promise<TestApp> {
  const sqlite = openDatabase(':memory:');
  const productRepository = new SqliteProductRepository(sqlite.db);
  const orderRepository = new SqliteOrderRepository(sqlite.db);
  const auditLogRepository = new SqliteAuditLogRepository(sqlite.db);
  const userRepository = new SqliteUserRepository(sqlite.db);
  const revokedTokenRepository = new SqliteRevokedTokenRepository(sqlite.db);
  const transactionRunner = new SqliteTransactionRunner(sqlite.db);
  const jwtSecret = 'test-secret';

  await productRepository.seedIfEmpty(defaultProducts);
  const admin = await userRepository.ensureAdmin({
    login: 'admin',
    password: 'admin-password',
  });

  const app = await buildApp({
    productRepository,
    orderRepository,
    auditLogRepository,
    userRepository,
    revokedTokenRepository,
    transactionRunner,
    jwtSecret,
    jwtExpiresIn: '1h',
    publicSiteUrl: 'https://arateki.test',
  });

  await app.ready();

  return {
    app,
    sqlite,
    jwtSecret,
    adminUserId: admin.id,
    close: async () => {
      await app.close();
      sqlite.close();
    },
  };
}
