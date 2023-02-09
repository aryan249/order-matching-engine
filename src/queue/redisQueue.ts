import { getRedisClient } from '../config/redis';
import { Order } from '../types/order';
import logger from '../config/logger';

export class RedisQueue {
  private keyPrefix = 'queue:orders:';
  private assetsKey = 'queue:assets';

  private getKey(asset: string): string {
    return `${this.keyPrefix}${asset}`;
  }

  async enqueue(asset: string, order: Order): Promise<void> {
    const redis = getRedisClient();
    const pipeline = redis.pipeline();
    pipeline.rpush(this.getKey(asset), JSON.stringify(order));
    pipeline.sadd(this.assetsKey, asset);
    await pipeline.exec();
    logger.debug('Order enqueued', { orderId: order.id, asset });
  }

  async dequeue(asset: string, count: number): Promise<Order[]> {
    const redis = getRedisClient();
    const orders: Order[] = [];

    for (let i = 0; i < count; i++) {
      const data = await redis.lpop(this.getKey(asset));
      if (!data) break;
      orders.push(JSON.parse(data));
    }

    return orders;
  }

  async peek(asset: string, count: number): Promise<Order[]> {
    const redis = getRedisClient();
    const items = await redis.lrange(this.getKey(asset), 0, count - 1);
    return items.map((item) => JSON.parse(item));
  }

