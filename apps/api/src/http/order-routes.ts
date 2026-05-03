import type { FastifyInstance } from 'fastify';
import { CreateOrderError, type CreateOrderUseCase } from '../application/create-order.js';
import type { GetOrderUseCase } from '../application/get-order.js';
import type { ListOrdersUseCase } from '../application/list-orders.js';
import { UpdateOrderStatusError, type UpdateOrderStatusUseCase } from '../application/update-order-status.js';
import type { RevokedTokenRepository } from '../domain/revoked-token.js';
import type { UserRepository } from '../domain/user.js';
import { authenticateAdmin } from './auth.js';
import { orderBodySchema, orderStatusUpdateSchema } from './schemas.js';

interface OrderRoutesDependencies {
  createOrder: CreateOrderUseCase;
  listOrders: ListOrdersUseCase;
  getOrder: GetOrderUseCase;
  updateOrderStatus: UpdateOrderStatusUseCase;
  users: UserRepository;
  revokedTokens: RevokedTokenRepository;
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

  app.get('/orders', async (request, reply) => {
    const admin = await authenticateAdmin(
      request,
      reply,
      dependencies.users,
      dependencies.revokedTokens,
    );
    if (!admin) return reply;

    const orders = await dependencies.listOrders.execute();
    return { orders };
  });

  app.get('/orders/:id', async (request, reply) => {
    const admin = await authenticateAdmin(
      request,
      reply,
      dependencies.users,
      dependencies.revokedTokens,
    );
    if (!admin) return reply;

    const params = request.params as { id: string };
    const order = await dependencies.getOrder.execute(params.id);

    if (!order) {
      return reply.code(404).send({ message: 'Order not found' });
    }

    return { order };
  });

  app.patch('/orders/:id/status', async (request, reply) => {
    const admin = await authenticateAdmin(
      request,
      reply,
      dependencies.users,
      dependencies.revokedTokens,
    );
    if (!admin) return reply;

    const params = request.params as { id: string };
    const parsedBody = orderStatusUpdateSchema.safeParse(request.body);

    if (!parsedBody.success) {
      return reply.code(400).send({
        message: 'Invalid status payload',
        issues: parsedBody.error.flatten().fieldErrors,
      });
    }

    try {
      await dependencies.updateOrderStatus.execute(params.id, parsedBody.data.status, admin.userId);
      return reply.code(204).send();
    } catch (error) {
      if (error instanceof UpdateOrderStatusError) {
        return reply.code(404).send({ message: 'Order not found' });
      }
      throw error;
    }
  });
}
