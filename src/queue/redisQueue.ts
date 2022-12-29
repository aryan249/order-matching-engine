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

  async length(asset: string): Promise<number> {
    const redis = getRedisClient();
    return redis.llen(this.getKey(asset));
  }

  async getAssets(): Promise<string[]> {
    const redis = getRedisClient();
    return redis.smembers(this.assetsKey);
  }

  async removeOrder(asset: string, orderId: string): Promise<void> {
    const redis = getRedisClient();
    const items = await redis.lrange(this.getKey(asset), 0, -1);
    for (const item of items) {
      const order: Order = JSON.parse(item);
      if (order.id === orderId) {
        await redis.lrem(this.getKey(asset), 1, item);
        break;
      }
    }
  }

  async updateOrder(asset: string, updatedOrder: Order): Promise<void> {
    const redis = getRedisClient();
    const key = this.getKey(asset);
    const items = await redis.lrange(key, 0, -1);

    for (let i = 0; i < items.length; i++) {
      const order: Order = JSON.parse(items[i]);
      if (order.id === updatedOrder.id) {
        await redis.lset(key, i, JSON.stringify(updatedOrder));
        break;
      }
    }
  }
}

// reduce memory allocation in batch processing - revision 14

// stream large trade result sets - revision 58

// correct HTTP method validation in routes - revision 102
