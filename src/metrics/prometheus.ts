import client from 'prom-client';
import { Request, Response, NextFunction } from 'express';

client.collectDefaultMetrics();

export const metrics = {
  ordersSubmitted: new client.Counter({
    name: 'orders_submitted_total',
    help: 'Total number of orders submitted',
    labelNames: ['side', 'asset'] as const,
  }),

  ordersMatched: new client.Counter({
    name: 'orders_matched_total',
    help: 'Total number of orders matched',
  }),

  tradesExecuted: new client.Counter({
    name: 'trades_executed_total',
    help: 'Total number of trades executed',
  }),

  batchesFlushed: new client.Counter({
    name: 'batches_flushed_total',
    help: 'Total number of batches flushed',
  }),

  matchingDuration: new client.Histogram({
    name: 'order_matching_duration_seconds',
    help: 'Duration of order matching in seconds',
    buckets: [0.01, 0.05, 0.1, 0.2, 0.5, 1],
  }),

  batchExecutionDuration: new client.Histogram({
    name: 'batch_execution_duration_seconds',
    help: 'Duration of batch execution in seconds',
    buckets: [0.05, 0.1, 0.25, 0.5, 1, 2.5],
  }),

  httpRequestDuration: new client.Histogram({
    name: 'http_request_duration_seconds',
    help: 'Duration of HTTP requests in seconds',
    labelNames: ['method', 'route', 'status'] as const,
    buckets: [0.01, 0.05, 0.1, 0.2, 0.5, 1],
  }),

  pendingOrders: new client.Gauge({
    name: 'pending_orders_count',
    help: 'Number of pending orders',
    labelNames: ['asset'] as const,
  }),

  wsConnections: new client.Gauge({
    name: 'ws_connections_active',
    help: 'Number of active WebSocket connections',
  }),

  batchBufferSize: new client.Gauge({
    name: 'batch_buffer_size',
    help: 'Current batch buffer size',
    labelNames: ['asset'] as const,
  }),
};

export function metricsMiddleware(req: Request, res: Response, next: NextFunction): void {
  const timer = metrics.httpRequestDuration.startTimer();

  res.on('finish', () => {
    timer({
      method: req.method,
      route: req.route?.path || req.path,
      status: res.statusCode.toString(),
    });
  });

  next();
}

export async function getMetrics(): Promise<string> {
  return client.register.metrics();
}

export function getContentType(): string {
  return client.register.contentType;
}

// extract request parsing utilities - revision 29

// use connection pooling for Redis pub/sub - revision 73

// correct trade fee calculation - revision 117

// extract queue message validators - revision 161
