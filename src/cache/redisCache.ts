import { getRedisClient } from '../config/redis';
import config from '../config/index';
import logger from '../config/logger';

export class RedisCache {
  private prefix = 'cache:';

  private getKey(method: string, path: string, queryHash: string): string {
    return `${this.prefix}${method}:${path}:${queryHash}`;
  }

  async get(method: string, path: string, queryHash: string): Promise<string | null> {
    const redis = getRedisClient();
    const key = this.getKey(method, path, queryHash);
    return redis.get(key);
  }

  async set(method: string, path: string, queryHash: string, data: string, ttl?: number): Promise<void> {
    const redis = getRedisClient();
    const key = this.getKey(method, path, queryHash);
    await redis.setex(key, ttl || config.cache.ttlSeconds, data);
    logger.debug('Cache set', { key, ttl: ttl || config.cache.ttlSeconds });
  }

  async invalidate(pattern: string): Promise<void> {
    const redis = getRedisClient();
    let cursor = '0';

    do {
      const [nextCursor, keys] = await redis.scan(cursor, 'MATCH', `${this.prefix}${pattern}`, 'COUNT', 100);
      cursor = nextCursor;

      if (keys.length > 0) {
        await redis.del(...keys);
        logger.debug('Cache invalidated', { pattern, keysRemoved: keys.length });
      }
    } while (cursor !== '0');
  }
}
