import { Router, Request, Response } from 'express';
import { getRedisClient } from '../config/redis';
import { pool } from '../config/database';
import authRoutes from './auth';
import metricsRoutes from './metrics';

export function createRouter(orderRoutes: Router): Router {
  const router = Router();

  router.get('/health', async (_req: Request, res: Response) => {
    const redisOk = getRedisClient().status === 'ready';
    let dbOk = false;
    try {
      await pool.query('SELECT 1');
      dbOk = true;
    } catch {
      // db not connected
    }

    const status = redisOk && dbOk ? 'ok' : 'degraded';
    const statusCode = status === 'ok' ? 200 : 503;

    res.status(statusCode).json({
      status,
      uptime: process.uptime(),
      redis: redisOk ? 'connected' : 'disconnected',
      database: dbOk ? 'connected' : 'disconnected',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
    });
  });

  router.use('/auth', authRoutes);
  router.use('/orders', orderRoutes);
  router.use('/metrics', metricsRoutes);

  return router;
}
