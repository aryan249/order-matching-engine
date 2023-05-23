import redis from '../config/redis';

export class RedisCache {
    async get(key: string): Promise<string | null> {
        return redis.get(key);
    }

    async set(key: string, value: string, ttl?: number): Promise<void> {
        if (ttl) {
            await redis.setex(key, ttl, value);
        } else {
            await redis.set(key, value);
        }
    }
}
