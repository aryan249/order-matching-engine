import { TradeRepository } from '../repositories/tradeRepository';
import { OrderRepository } from '../repositories/orderRepository';
import { RedisPubSub, Channels } from '../queue/pubsub';
import { TradeResult } from '../types/trade';
import { OrderStatus } from '../types/order';
import { getClient } from '../config/database';
import { metrics } from '../metrics/prometheus';
import config from '../config/index';
import logger from '../config/logger';

export class BatchExecutionService {
  private buffer: Map<string, TradeResult[]> = new Map();
  private timer: NodeJS.Timeout | null = null;

  constructor(
    private tradeRepo: TradeRepository,
    private orderRepo: OrderRepository,
    private pubsub: RedisPubSub
  ) {}

  addTrade(result: TradeResult): void {
    const asset = result.trade.asset;
    const assetBuffer = this.buffer.get(asset) || [];
    assetBuffer.push(result);
    this.buffer.set(asset, assetBuffer);

    metrics.batchBufferSize.set({ asset }, assetBuffer.length);

    if (assetBuffer.length >= config.batch.chunkSize) {
      this.flush(asset);
    } else if (!this.timer) {
      this.timer = setTimeout(() => {
        this.timer = null;
        this.flushAll();
      }, config.batch.windowMs);
    }
  }

  async flush(asset: string): Promise<void> {
    const assetBuffer = this.buffer.get(asset);
    if (!assetBuffer || assetBuffer.length === 0) return;

    const chunk = assetBuffer.splice(0, config.batch.chunkSize);
    if (assetBuffer.length === 0) {
      this.buffer.delete(asset);
    }

    const timer = metrics.batchExecutionDuration.startTimer();
    const client = await getClient();

    try {
      await client.query('BEGIN');

      const trades = chunk.map((r) => r.trade);
      await this.tradeRepo.batchCreate(trades);

      for (const result of chunk) {
        if (result.makerOrder.remainingQuantity === 0) {
          await this.orderRepo.updateStatus(result.makerOrder.id, OrderStatus.EXECUTED);
        }
