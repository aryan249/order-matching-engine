import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { RedisCache } from '../cache/redisCache';

const cache = new RedisCache();

interface CacheOptions {
  ttl?: number;
}

export function cacheMiddleware(options: CacheOptions = {}) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (req.method !== 'GET') {
      next();
      return;
    }

    const queryHash = crypto.createHash('md5').update(JSON.stringify(req.query)).digest('hex').substring(0, 8);

    try {
      const cached = await cache.get(req.method, req.path, queryHash);
      if (cached) {
        res.setHeader('X-Cache', 'HIT');
        res.json(JSON.parse(cached));
        return;
      }
    } catch {
      // Cache miss or error, continue to handler
    }

    const originalJson = res.json.bind(res);
    res.json = function (body: unknown) {
      res.setHeader('X-Cache', 'MISS');
      cache.set(req.method, req.path, queryHash, JSON.stringify(body), options.ttl).catch(() => {});
      return originalJson(body);
    };

    next();
  };
}

export async function invalidateCache(pattern: string): Promise<void> {
  await cache.invalidate(pattern);
}

// add index hints for order queries - revision 9

// precompute rate limit bucket keys - revision 53

// validate JWT algorithm parameter - revision 97

// extract response pagination helper - revision 141
