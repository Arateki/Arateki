import type { FastifyInstance } from 'fastify';
import type { CreateProductUseCase } from '../application/create-product.js';
import type { GetAdminProductUseCase } from '../application/get-admin-product.js';
import type { ListProductsUseCase } from '../application/list-products.js';
import type { ListAdminProductsUseCase } from '../application/list-admin-products.js';
import { UpdateProductError, type UpdateProductUseCase } from '../application/update-product.js';
import type { RevokedTokenRepository } from '../domain/revoked-token.js';
import type { UserRepository } from '../domain/user.js';
import { authenticateAdmin } from './auth.js';
import { buildGoogleShoppingXml, buildMetaCatalogCsv, buildProductsTsv, getCatalogSiteUrl } from './catalog-feed.js';
import { productBodySchema, productListQuerySchema } from './schemas.js';

interface ProductRoutesDependencies {
  listProducts: ListProductsUseCase;
  listAdminProducts: ListAdminProductsUseCase;
  getAdminProduct: GetAdminProductUseCase;
  createProduct: CreateProductUseCase;
  updateProduct: UpdateProductUseCase;
  users: UserRepository;
  revokedTokens: RevokedTokenRepository;
  publicSiteUrl?: string | undefined;
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

  app.get('/feeds/google-shopping.xml', async (request, reply) => {
    const parsedQuery = productListQuerySchema.safeParse(request.query);
    if (!parsedQuery.success) {
      return reply.code(400).send({
        message: 'Invalid product feed query',
        issues: parsedQuery.error.flatten().fieldErrors,
      });
    }

    const products = await dependencies.listProducts.execute({
      currency: parsedQuery.data.country?.toUpperCase() === 'BR' ? 'BRL' : 'USD',
      locale: parsedQuery.data.lang ?? 'pt',
    });
    const siteUrl = getCatalogSiteUrl(request, dependencies.publicSiteUrl);

    return reply
      .type('application/rss+xml; charset=utf-8')
      .send(buildGoogleShoppingXml(products, siteUrl));
  });

  app.get('/feeds/products.tsv', async (request, reply) => {
    const parsedQuery = productListQuerySchema.safeParse(request.query);
    if (!parsedQuery.success) {
      return reply.code(400).send({
        message: 'Invalid product feed query',
        issues: parsedQuery.error.flatten().fieldErrors,
      });
    }

    const products = await dependencies.listProducts.execute({
      currency: parsedQuery.data.country?.toUpperCase() === 'BR' ? 'BRL' : 'USD',
      locale: parsedQuery.data.lang ?? 'pt',
    });
    const siteUrl = getCatalogSiteUrl(request, dependencies.publicSiteUrl);

    return reply
      .type('text/tab-separated-values; charset=utf-8')
      .send(buildProductsTsv(products, siteUrl));
  });

  app.get('/feeds/meta-catalog.csv', async (request, reply) => {
    const parsedQuery = productListQuerySchema.safeParse(request.query);
    if (!parsedQuery.success) {
      return reply.code(400).send({
        message: 'Invalid product feed query',
        issues: parsedQuery.error.flatten().fieldErrors,
      });
    }

    const products = await dependencies.listProducts.execute({
      currency: parsedQuery.data.country?.toUpperCase() === 'BR' ? 'BRL' : 'USD',
      locale: parsedQuery.data.lang ?? 'pt',
    });
    const siteUrl = getCatalogSiteUrl(request, dependencies.publicSiteUrl);

    return reply
      .type('text/csv; charset=utf-8')
      .send(buildMetaCatalogCsv(products, siteUrl));
  });

  app.get('/admin/products', async (request, reply) => {
    const admin = await authenticateAdmin(
      request,
      reply,
      dependencies.users,
      dependencies.revokedTokens,
    );
    if (!admin) return reply;

    const products = await dependencies.listAdminProducts.execute();
    return { products };
  });

  app.get('/admin/products/:id', async (request, reply) => {
    const admin = await authenticateAdmin(
      request,
      reply,
      dependencies.users,
      dependencies.revokedTokens,
    );
    if (!admin) return reply;

    const params = request.params as { id: string };
    const product = await dependencies.getAdminProduct.execute(params.id);
    if (!product) {
      return reply.code(404).send({ message: 'Product not found' });
    }

    return { product };
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

    const product = await dependencies.createProduct.execute(parsedBody.data, admin.userId);
    return reply.code(201).send({ product });
  });

  app.put('/products/:id', async (request, reply) => {
    const admin = await authenticateAdmin(
      request,
      reply,
      dependencies.users,
      dependencies.revokedTokens,
    );
    if (!admin) return reply;

    const params = request.params as { id: string };
    const parsedBody = productBodySchema.safeParse(request.body);

    if (!parsedBody.success) {
      return reply.code(400).send({
        message: 'Invalid product payload',
        issues: parsedBody.error.flatten().fieldErrors,
      });
    }

    try {
      const product = await dependencies.updateProduct.execute(params.id, parsedBody.data, admin.userId);
      return reply.code(200).send({ product });
    } catch (error) {
      if (error instanceof UpdateProductError) {
        return reply.code(404).send({ message: 'Product not found' });
      }
      throw error;
    }
  });
}
