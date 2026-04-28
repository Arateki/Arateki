import { MongoMemoryReplSet } from 'mongodb-memory-server';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '../app.js';
import { defaultProducts } from '../config/default-products.js';
import { createMongoConnection, type MongoConnection } from '../infrastructure/mongo.js';
import { MongoOrderRepository } from '../infrastructure/mongo-order-repository.js';
import { MongoProductRepository } from '../infrastructure/mongo-product-repository.js';
import { MongoRevokedTokenRepository } from '../infrastructure/mongo-revoked-token-repository.js';
import { MongoUserRepository } from '../infrastructure/mongo-user-repository.js';

export interface TestApp {
  app: FastifyInstance;
  mongo: MongoConnection;
  mongoServer: MongoMemoryReplSet;
  jwtSecret: string;
  adminUserId: string;
  close(): Promise<void>;
}

export async function createTestApp(): Promise<TestApp> {
  const mongoServer = await MongoMemoryReplSet.create({
    replSet: { count: 1, storageEngine: 'wiredTiger' }
  });
  
  const mongo = await createMongoConnection(mongoServer.getUri());
  const productRepository = new MongoProductRepository(mongo.db);
  const orderRepository = new MongoOrderRepository(mongo.db);
  const userRepository = new MongoUserRepository(mongo.db);
  const revokedTokenRepository = new MongoRevokedTokenRepository(mongo.db);
  const jwtSecret = 'test-secret';

  await productRepository.seedIfEmpty(defaultProducts);
  await orderRepository.ensureIndexes();
  await userRepository.ensureIndexes();
  await revokedTokenRepository.ensureIndexes();

  const admin = await userRepository.ensureAdmin({
    login: 'admin',
    password: 'admin-password',
  });

  const app = await buildApp({
    productRepository,
    orderRepository,
    userRepository,
    revokedTokenRepository,
    mongoClient: mongo.client,
    jwtSecret,
    jwtExpiresIn: '1h',
  });

  await app.ready();

  return {
    app,
    mongo,
    mongoServer,
    jwtSecret,
    adminUserId: admin.id,
    close: async () => {
      await app.close();
      await mongo.close();
      await mongoServer.stop();
    },
  };
}
