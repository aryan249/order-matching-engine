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
