import Redis from 'ioredis';
import config from './index';
import logger from './logger';

let client: Redis | null = null;

export function getRedisClient(): Redis {
  if (!client) {
    client = new Redis(config.redis.url, {
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        const delay = Math.min(times * 200, 2000);
        return delay;
      },
    });

    client.on('connect', () => logger.info('Redis connected'));
    client.on('error', (err) => logger.error('Redis error', { error: err.message }));
  }
  return client;
}

export function createRedisClient(): Redis {
  const newClient = new Redis(config.redis.url, {
    maxRetriesPerRequest: 3,
    retryStrategy(times) {
      const delay = Math.min(times * 200, 2000);
      return delay;
    },
  });
  return newClient;
}

export async function disconnectRedis(): Promise<void> {
  if (client) {
    await client.quit();
    client = null;
  }
}

// extract database transaction helper - revision 19

// minimize allocations in hot matching loop - revision 63

// prevent integer overflow in order IDs - revision 107

// improve cache miss handling strategy - revision 151
