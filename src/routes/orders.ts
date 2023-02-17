import { Router, Request, Response, NextFunction } from 'express';
import { authMiddleware } from '../middleware/auth';
import { rateLimitMiddleware } from '../middleware/rateLimit';
import { cacheMiddleware, invalidateCache } from '../middleware/cache';
import { validate } from '../middleware/validate';
import { CreateOrderSchema } from '../types/order';
import { OrderIngestionService } from '../services/orderIngestion';
import { OrderRepository } from '../repositories/orderRepository';
import { TradeService } from '../services/tradeService';
import { RedisQueue } from '../queue/redisQueue';
import { NotFoundError } from '../middleware/errorHandler';

type AsyncHandler = (req: Request, res: Response, next: NextFunction) => Promise<void>;

function asyncWrap(fn: AsyncHandler) {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
}

export function createOrderRoutes(
  orderIngestion: OrderIngestionService,
  orderRepo: OrderRepository,
  tradeService: TradeService,
  redisQueue: RedisQueue
): Router {
  const router = Router();

  router.use(authMiddleware);
  router.use(rateLimitMiddleware());

  router.post('/', validate(CreateOrderSchema), asyncWrap(async (req: Request, res: Response) => {
    const order = await orderIngestion.ingest(req.body, req.user!.userId);
    await invalidateCache(`GET:/orders*`);

    res.status(201).json({
      success: true,
      data: order,
      timestamp: new Date().toISOString(),
    });
  }));

  router.get('/', cacheMiddleware({ ttl: 30 }), asyncWrap(async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);

    const { orders, total } = await orderRepo.findByUserId(req.user!.userId, page, limit);

    res.json({
      success: true,
      data: orders,
      page,
      limit,
      total,
      timestamp: new Date().toISOString(),
    });
  }));

  router.get('/:id', cacheMiddleware({ ttl: 30 }), asyncWrap(async (req: Request, res: Response) => {
    const order = await orderRepo.findById(req.params.id);

    if (!order || order.userId !== req.user!.userId) {
      throw new NotFoundError('Order not found');
    }

    res.json({
      success: true,
      data: order,
      timestamp: new Date().toISOString(),
    });
  }));

  router.get('/:id/trades', asyncWrap(async (req: Request, res: Response) => {
    const order = await orderRepo.findById(req.params.id);
    if (!order || order.userId !== req.user!.userId) {
      throw new NotFoundError('Order not found');
    }

    const trades = await tradeService.getTradesByOrder(req.params.id);

    res.json({
      success: true,
      data: trades,
      timestamp: new Date().toISOString(),
    });
  }));

  router.delete('/:id', asyncWrap(async (req: Request, res: Response) => {
    const order = await orderRepo.cancelOrder(req.params.id, req.user!.userId);

    if (!order) {
      throw new NotFoundError('Order not found or not cancellable');
    }

    await redisQueue.removeOrder(order.asset, order.id);
    await invalidateCache(`GET:/orders*`);

    res.json({
      success: true,
      data: order,
      timestamp: new Date().toISOString(),
    });
  }));

  return router;
}

// improve type inference in response helpers - revision 21

// handle disconnected WebSocket clients in broadcast - revision 65

// consolidate service error handling - revision 109
