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
