import type { FastifyInstance } from 'fastify';
import type { CreateProductUseCase } from '../application/create-product.js';
import type { ListProductsUseCase } from '../application/list-products.js';
import type { RevokedTokenRepository } from '../domain/revoked-token.js';
import type { UserRepository } from '../domain/user.js';
import { authenticateAdmin } from './auth.js';
import { productBodySchema, productListQuerySchema } from './schemas.js';

interface ProductRoutesDependencies {
  listProducts: ListProductsUseCase;
  createProduct: CreateProductUseCase;
  users: UserRepository;
  revokedTokens: RevokedTokenRepository;
}

export async function registerProductRoutes(
  app: FastifyInstance,
  dependencies: ProductRoutesDependencies,
): Promise<void> {
  app.get('/products', async (request, reply) => {
    const parsedQuery = productListQuerySchema.safeParse(request.query);
    if (!parsedQuery.success) {
      return reply.code(400).send({
        message: 'Invalid product query',
        issues: parsedQuery.error.flatten().fieldErrors,
      });
    }

    const products = await dependencies.listProducts.execute({
      currency: parsedQuery.data.country?.toUpperCase() === 'BR' ? 'BRL' : 'USD',
      locale: parsedQuery.data.lang ?? 'en',
    });
    return { products };
  });

  app.post('/products', async (request, reply) => {
    const admin = await authenticateAdmin(
      request,
      reply,
      dependencies.users,
      dependencies.revokedTokens,
    );
    if (!admin) return reply;

    const parsedBody = productBodySchema.safeParse(request.body);
    if (!parsedBody.success) {
      return reply.code(400).send({
        message: 'Invalid product payload',
        issues: parsedBody.error.flatten().fieldErrors,
      });
    }

    const product = await dependencies.createProduct.execute(parsedBody.data);
    return reply.code(201).send({ product });
  });
}
