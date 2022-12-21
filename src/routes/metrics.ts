import { Router, Request, Response } from 'express';
import { getMetrics, getContentType } from '../metrics/prometheus';

const router = Router();

router.get('/', async (_req: Request, res: Response) => {
  const metrics = await getMetrics();
  res.set('Content-Type', getContentType());
  res.send(metrics);
});

export default router;
