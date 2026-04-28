import type { FastifyInstance } from 'fastify';
import { CreateOrderError, type CreateOrderUseCase } from '../application/create-order.js';
import { orderBodySchema } from './schemas.js';

interface OrderRoutesDependencies {
  createOrder: CreateOrderUseCase;
}

export async function registerOrderRoutes(
  app: FastifyInstance,
  dependencies: OrderRoutesDependencies,
): Promise<void> {
  app.post('/orders', async (request, reply) => {
    const parsedBody = orderBodySchema.safeParse(request.body);
    if (!parsedBody.success) {
      return reply.code(400).send({
        message: 'Invalid order payload',
        issues: parsedBody.error.flatten().fieldErrors,
      });
    }

    try {
      const { lang, ...input } = parsedBody.data;
      const order = await dependencies.createOrder.execute({
        ...input,
        locale: lang ?? 'en',
      });
      return reply.code(201).send({ order });
    } catch (error) {
      if (error instanceof CreateOrderError) {
        return reply.code(400).send({
          message: error.code,
          details: error.details,
        });
      }

      throw error;
    }
  });
}
