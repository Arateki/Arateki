import { buildApp } from './app.js';
import { BootstrapAdminUseCase } from './application/bootstrap-admin.js';
import { defaultProducts } from './config/default-products.js';
import { loadEnv } from './config/env.js';
import { createMongoConnection } from './infrastructure/mongo.js';
import { MongoOrderRepository } from './infrastructure/mongo-order-repository.js';
import { MongoProductRepository } from './infrastructure/mongo-product-repository.js';
import { MongoAuditLogRepository } from './infrastructure/mongo-audit-log-repository.js';
import { MongoRevokedTokenRepository } from './infrastructure/mongo-revoked-token-repository.js';
import { MongoUserRepository } from './infrastructure/mongo-user-repository.js';

const env = loadEnv();
const mongo = await createMongoConnection(env.mongodbUri);

const productRepository = new MongoProductRepository(mongo.db);
const orderRepository = new MongoOrderRepository(mongo.db);
const auditLogRepository = new MongoAuditLogRepository(mongo.db);
const userRepository = new MongoUserRepository(mongo.db);
const revokedTokenRepository = new MongoRevokedTokenRepository(mongo.db);

await productRepository.seedIfEmpty(defaultProducts);
await orderRepository.ensureIndexes();
await auditLogRepository.ensureIndexes();
await userRepository.ensureIndexes();
await revokedTokenRepository.ensureIndexes();
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
  mongoClient: mongo.client,
  jwtSecret: env.jwtSecret,
  jwtExpiresIn: env.jwtExpiresIn,
  corsOrigin: env.corsOrigin,
});

const shutdown = async () => {
  await app.close();
  await mongo.close();
};

process.on('SIGINT', () => {
  void shutdown().then(() => process.exit(0));
});
process.on('SIGTERM', () => {
  void shutdown().then(() => process.exit(0));
});

await app.listen({ port: env.port, host: env.host });
