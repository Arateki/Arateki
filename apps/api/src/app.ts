import Fastify, { type FastifyInstance } from 'fastify';
import jwt from '@fastify/jwt';
import rateLimit from '@fastify/rate-limit';
import type { MongoClient } from 'mongodb';
import { CreateOrderUseCase } from './application/create-order.js';
import type { ProductRepository } from './domain/product.js';
import type { OrderRepository } from './domain/order.js';
import type { RevokedTokenRepository } from './domain/revoked-token.js';
import type { UserRepository } from './domain/user.js';
import { ChangePasswordUseCase } from './application/change-password.js';
import { ListProductsUseCase } from './application/list-products.js';
import { CreateProductUseCase } from './application/create-product.js';
import { LoginUseCase } from './application/login.js';
import { RevokeTokenUseCase } from './application/revoke-token.js';
import { registerAuthRoutes } from './http/auth-routes.js';
import { registerOrderRoutes } from './http/order-routes.js';
import { registerProductRoutes } from './http/product-routes.js';

export interface AppDependencies {
  productRepository: ProductRepository;
  orderRepository: OrderRepository;
  userRepository: UserRepository;
  revokedTokenRepository: RevokedTokenRepository;
  mongoClient: MongoClient;
  jwtSecret: string;
  jwtExpiresIn: string;
}

export async function buildApp(dependencies: AppDependencies): Promise<FastifyInstance> {
  const app = Fastify({
    logger: process.env.NODE_ENV !== 'test',
  });

  await app.register(jwt, {
    secret: dependencies.jwtSecret,
    sign: {
      expiresIn: dependencies.jwtExpiresIn,
    },
  });

  await app.register(rateLimit, {
    global: false,
  });

  app.get('/health', async () => ({ status: 'ok' }));

  await registerAuthRoutes(app, {
    login: new LoginUseCase(dependencies.userRepository),
    changePassword: new ChangePasswordUseCase(dependencies.userRepository),
    revokeToken: new RevokeTokenUseCase(dependencies.revokedTokenRepository),
    users: dependencies.userRepository,
    revokedTokens: dependencies.revokedTokenRepository,
  });

  await registerProductRoutes(app, {
    listProducts: new ListProductsUseCase(dependencies.productRepository),
    createProduct: new CreateProductUseCase(dependencies.productRepository),
    users: dependencies.userRepository,
    revokedTokens: dependencies.revokedTokenRepository,
  });

  await registerOrderRoutes(app, {
    createOrder: new CreateOrderUseCase(
      dependencies.orderRepository,
      dependencies.productRepository,
      dependencies.mongoClient,
    ),
  });

  app.setErrorHandler((error, _request, reply) => {
    app.log.error(error);
    return reply.code(500).send({ message: 'Internal server error' });
  });

  return app;
}
