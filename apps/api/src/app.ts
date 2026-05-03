import Fastify, { type FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import jwt from '@fastify/jwt';
import rateLimit from '@fastify/rate-limit';
import type { MongoClient } from 'mongodb';
import { CreateOrderUseCase } from './application/create-order.js';
import { GetOrderUseCase } from './application/get-order.js';
import { ListOrdersUseCase } from './application/list-orders.js';
import { UpdateOrderStatusUseCase } from './application/update-order-status.js';
import type { ProductRepository } from './domain/product.js';
import type { OrderRepository } from './domain/order.js';
import type { AuditLogRepository } from './domain/audit-log.js';
import type { RevokedTokenRepository } from './domain/revoked-token.js';
import type { UserRepository } from './domain/user.js';
import { ChangePasswordUseCase } from './application/change-password.js';
import { ListProductsUseCase } from './application/list-products.js';
import { ListAdminProductsUseCase } from './application/list-admin-products.js';
import { GetAdminProductUseCase } from './application/get-admin-product.js';
import { CreateProductUseCase } from './application/create-product.js';
import { UpdateProductUseCase } from './application/update-product.js';
import { LoginUseCase } from './application/login.js';
import { RevokeTokenUseCase } from './application/revoke-token.js';
import { registerAuthRoutes } from './http/auth-routes.js';
import { registerOrderRoutes } from './http/order-routes.js';
import { registerProductRoutes } from './http/product-routes.js';

export interface AppDependencies {
  productRepository: ProductRepository;
  orderRepository: OrderRepository;
  auditLogRepository: AuditLogRepository;
  userRepository: UserRepository;
  revokedTokenRepository: RevokedTokenRepository;
  mongoClient: MongoClient;
  jwtSecret: string;
  jwtExpiresIn: string;
  corsOrigin?: string[] | undefined;
}

export async function buildApp(dependencies: AppDependencies): Promise<FastifyInstance> {
  const app = Fastify({
    logger: process.env.NODE_ENV !== 'test',
    bodyLimit: 5 * 1024 * 1024,
  });

  await app.register(jwt, {
    secret: dependencies.jwtSecret,
    sign: {
      expiresIn: dependencies.jwtExpiresIn,
    },
  });

  await app.register(rateLimit, {
    global: true,
    max: 100,
    timeWindow: '1 minute',
  });

  await app.register(helmet);
  await app.register(cors, {
    origin: dependencies.corsOrigin?.length ? dependencies.corsOrigin : false,
    credentials: true,
  });

  app.get('/health', async () => ({ status: 'ok' }));

  await registerAuthRoutes(app, {
    login: new LoginUseCase(dependencies.userRepository),
    changePassword: new ChangePasswordUseCase(
      dependencies.userRepository,
      undefined,
      dependencies.auditLogRepository,
    ),
    revokeToken: new RevokeTokenUseCase(dependencies.revokedTokenRepository),
    users: dependencies.userRepository,
    revokedTokens: dependencies.revokedTokenRepository,
  });

  await registerProductRoutes(app, {
    listProducts: new ListProductsUseCase(dependencies.productRepository),
    listAdminProducts: new ListAdminProductsUseCase(dependencies.productRepository),
    getAdminProduct: new GetAdminProductUseCase(dependencies.productRepository),
    createProduct: new CreateProductUseCase(
      dependencies.productRepository,
      dependencies.auditLogRepository,
    ),
    updateProduct: new UpdateProductUseCase(
      dependencies.productRepository,
      dependencies.auditLogRepository,
    ),
    users: dependencies.userRepository,
    revokedTokens: dependencies.revokedTokenRepository,
  });

  await registerOrderRoutes(app, {
    createOrder: new CreateOrderUseCase(
      dependencies.orderRepository,
      dependencies.productRepository,
      dependencies.mongoClient,
    ),
    listOrders: new ListOrdersUseCase(dependencies.orderRepository),
    getOrder: new GetOrderUseCase(dependencies.orderRepository),
    updateOrderStatus: new UpdateOrderStatusUseCase(
      dependencies.orderRepository,
      dependencies.auditLogRepository,
    ),
    users: dependencies.userRepository,
    revokedTokens: dependencies.revokedTokenRepository,
  });

  app.setErrorHandler((error, _request, reply) => {
    app.log.error(error);
    return reply.code(500).send({ message: 'Internal server error' });
  });

  return app;
}
