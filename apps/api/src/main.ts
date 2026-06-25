import { buildApp } from './app.js';
import { BootstrapAdminUseCase } from './application/bootstrap-admin.js';
import { defaultProducts } from './config/default-products.js';
import { loadEnv } from './config/env.js';
import { openDatabase } from './infrastructure/sqlite/sqlite.js';
import { SqliteOrderRepository } from './infrastructure/sqlite/sqlite-order-repository.js';
import { SqliteProductRepository } from './infrastructure/sqlite/sqlite-product-repository.js';
import { SqliteAuditLogRepository } from './infrastructure/sqlite/sqlite-audit-log-repository.js';
import { SqliteRevokedTokenRepository } from './infrastructure/sqlite/sqlite-revoked-token-repository.js';
import { SqliteUserRepository } from './infrastructure/sqlite/sqlite-user-repository.js';
import { SqliteTransactionRunner } from './infrastructure/sqlite/sqlite-transaction-runner.js';

const env = loadEnv();
const sqlite = openDatabase(env.sqlitePath);

const productRepository = new SqliteProductRepository(sqlite.db);
const orderRepository = new SqliteOrderRepository(sqlite.db);
const auditLogRepository = new SqliteAuditLogRepository(sqlite.db);
const userRepository = new SqliteUserRepository(sqlite.db);
const revokedTokenRepository = new SqliteRevokedTokenRepository(sqlite.db);
const transactionRunner = new SqliteTransactionRunner(sqlite.db);

await productRepository.seedIfEmpty(defaultProducts);
await revokedTokenRepository.purgeExpired();
await new BootstrapAdminUseCase(userRepository).execute({
  login: env.adminLogin,
  password: env.adminPassword,
});

const app = await buildApp({
  productRepository,
  orderRepository,
  auditLogRepository,
  userRepository,
  revokedTokenRepository,
  transactionRunner,
  jwtSecret: env.jwtSecret,
  jwtExpiresIn: env.jwtExpiresIn,
  corsOrigin: env.corsOrigin,
  publicSiteUrl: env.publicSiteUrl,
});

const shutdown = async () => {
  await app.close();
  sqlite.close();
};

process.on('SIGINT', () => {
  void shutdown().then(() => process.exit(0));
});
process.on('SIGTERM', () => {
  void shutdown().then(() => process.exit(0));
});

await app.listen({ port: env.port, host: env.host });
