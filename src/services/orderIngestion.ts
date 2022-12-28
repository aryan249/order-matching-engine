import { OrderRepository } from '../repositories/orderRepository';
import { RedisQueue } from '../queue/redisQueue';
import { RedisPubSub, Channels } from '../queue/pubsub';
import { CreateOrderDto, Order, OrderSide } from '../types/order';
import { metrics } from '../metrics/prometheus';
import logger from '../config/logger';

export class OrderIngestionService {
  constructor(
    private orderRepo: OrderRepository,
    private redisQueue: RedisQueue,
    private pubsub: RedisPubSub
  ) {}

  async ingest(dto: CreateOrderDto, userId: string): Promise<Order> {
    const order = await this.orderRepo.create({ ...dto, userId });

    logger.info('Order created', { orderId: order.id, side: order.side, asset: order.asset });
    metrics.ordersSubmitted.inc({ side: order.side, asset: order.asset });

    if (order.side === OrderSide.MAKER) {
      await this.redisQueue.enqueue(order.asset, order);
      logger.info('Maker order enqueued', { orderId: order.id, asset: order.asset });
    }

    await this.pubsub.publish(Channels.ORDER_NEW, order);

    if (order.side === OrderSide.TAKER) {
      await this.pubsub.publish(Channels.ORDER_MATCHED, order);
    }

    return order;
  }
}
