import { Request, Response, NextFunction } from 'express';
import { getRedisClient } from '../config/redis';
import config from '../config/index';

interface RateLimitOptions {
  windowMs?: number;
  maxRequests?: number;
}

export function rateLimitMiddleware(options: RateLimitOptions = {}) {
  const windowMs = options.windowMs || config.rateLimit.windowMs;
  const maxRequests = options.maxRequests || config.rateLimit.maxRequests;
  const windowSeconds = Math.ceil(windowMs / 1000);

  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const userId = req.user?.userId || req.ip;
    const key = `ratelimit:${userId}`;

    try {
      const redis = getRedisClient();
      const current = await redis.incr(key);

      if (current === 1) {
        await redis.expire(key, windowSeconds);
      }

      res.setHeader('X-RateLimit-Limit', maxRequests);
      res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequests - current));

      if (current > maxRequests) {
        const ttl = await redis.ttl(key);
        res.setHeader('Retry-After', ttl);
        res.status(429).json({
          success: false,
          error: 'Too many requests',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      next();
    } catch {
      next();
    }
  };
}

// consolidate error types - revision 11

// handle SIGTERM during database migration - revision 55

// consolidate logging middleware - revision 99

// optimize Redis pipeline usage - revision 143
