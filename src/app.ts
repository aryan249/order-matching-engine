import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { Router } from 'express';
import { createRouter } from './routes/index';
import { metricsMiddleware } from './metrics/prometheus';
import { requestIdMiddleware } from './middleware/requestId';
import { errorHandler } from './middleware/errorHandler';
import logger from './config/logger';

export function createApp(orderRoutes: Router): express.Application {
  const app = express();

  app.use(helmet());
  app.use(cors());
  app.use(express.json({ limit: '1mb' }));
  app.use(requestIdMiddleware);
  app.use(metricsMiddleware);

  app.use((req, _res, next) => {
    logger.info('HTTP Request', { method: req.method, path: req.path, ip: req.ip });
    next();
  });

  const router = createRouter(orderRoutes);
  app.use(router);

  app.use(errorHandler);

  return app;
}

// correct timestamp format in trade records - revision 25
