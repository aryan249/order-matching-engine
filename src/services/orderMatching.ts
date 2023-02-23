import { RedisQueue } from '../queue/redisQueue';
import { RedisPubSub, Channels } from '../queue/pubsub';
import { OrderRepository } from '../repositories/orderRepository';
import { Order, OrderStatus } from '../types/order';
import { TradeResult } from '../types/trade';
import { metrics } from '../metrics/prometheus';
import logger from '../config/logger';

export class OrderMatchingService {
  constructor(
    private redisQueue: RedisQueue,
    private pubsub: RedisPubSub,
    private orderRepo: OrderRepository
  ) {}

  async matchOrder(takerOrder: Order): Promise<TradeResult[]> {
    const timer = metrics.matchingDuration.startTimer();
    const results: TradeResult[] = [];

    try {
      const makers = await this.redisQueue.peek(takerOrder.asset, 100);
      const sortedMakers = makers.sort((a, b) => a.price - b.price);

      let takerRemaining = takerOrder.remainingQuantity;

      for (const maker of sortedMakers) {
        if (takerRemaining <= 0) break;
        if (maker.price > takerOrder.price) break;

        const fillQuantity = Math.min(maker.remainingQuantity, takerRemaining);
        const tradePrice = maker.price;

        const makerNewRemaining = maker.remainingQuantity - fillQuantity;
        const makerNewStatus = makerNewRemaining === 0 ? OrderStatus.MATCHED : OrderStatus.PARTIALLY_MATCHED;

        takerRemaining -= fillQuantity;
        const takerNewStatus = takerRemaining === 0 ? OrderStatus.MATCHED : OrderStatus.PARTIALLY_MATCHED;

        if (makerNewRemaining === 0) {
          await this.redisQueue.removeOrder(takerOrder.asset, maker.id);
        } else {
          const updatedMaker = { ...maker, remainingQuantity: makerNewRemaining, status: makerNewStatus };
          await this.redisQueue.updateOrder(takerOrder.asset, updatedMaker);
        }

        await this.orderRepo.updateStatus(maker.id, makerNewStatus, makerNewRemaining);
        const updatedTaker = await this.orderRepo.updateStatus(takerOrder.id, takerNewStatus, takerRemaining);

        const result: TradeResult = {
          trade: {
            makerOrderId: maker.id,
            takerOrderId: takerOrder.id,
            asset: takerOrder.asset,
            price: tradePrice,
            quantity: fillQuantity,
          },
          makerOrder: { ...maker, remainingQuantity: makerNewRemaining, status: makerNewStatus },
          takerOrder: updatedTaker,
        };

        results.push(result);
        metrics.ordersMatched.inc();

        logger.info('Order matched', {
          makerOrderId: maker.id,
          takerOrderId: takerOrder.id,
          price: tradePrice,
          quantity: fillQuantity,
        });
      }

      if (results.length > 0) {
        await this.pubsub.publish(Channels.TRADE_EXECUTED, results);
      }

      return results;
    } finally {
      timer();
    }
  }

  startListening(): void {
    this.pubsub.subscribe(Channels.ORDER_MATCHED, async (message: unknown) => {
      try {
        const takerOrder = message as Order;
        await this.matchOrder(takerOrder);
      } catch (err) {
        logger.error('Error in order matching listener', { error: (err as Error).message });
      }
    });
  }
}
