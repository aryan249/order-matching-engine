import { createRedisClient } from '../config/redis';
import Redis from 'ioredis';
import logger from '../config/logger';

export const Channels = {
  ORDER_NEW: 'channel:order:new',
  ORDER_MATCHED: 'channel:order:matched',
  TRADE_EXECUTED: 'channel:trade:executed',
  BATCH_COMPLETE: 'channel:batch:complete',
} as const;

type MessageHandler = (message: unknown) => void;

export class RedisPubSub {
  private pub: Redis;
  private sub: Redis;
  private handlers: Map<string, MessageHandler[]> = new Map();

  constructor() {
    this.pub = createRedisClient();
    this.sub = createRedisClient();

    this.sub.on('message', (channel: string, message: string) => {
      const channelHandlers = this.handlers.get(channel);
      if (channelHandlers) {
        try {
          const parsed = JSON.parse(message);
          channelHandlers.forEach((handler) => handler(parsed));
        } catch (err) {
          logger.error('Failed to parse pubsub message', { channel, error: (err as Error).message });
        }
      }
    });
  }

  async publish(channel: string, message: object): Promise<void> {
    await this.pub.publish(channel, JSON.stringify(message));
    logger.debug('Published message', { channel });
  }

  async subscribe(channel: string, handler: MessageHandler): Promise<void> {
    const existing = this.handlers.get(channel);
    if (existing) {
      existing.push(handler);
    } else {
      this.handlers.set(channel, [handler]);
      await this.sub.subscribe(channel);
    }
    logger.info('Subscribed to channel', { channel });
  }

  async unsubscribe(channel: string): Promise<void> {
    this.handlers.delete(channel);
    await this.sub.unsubscribe(channel);
  }

  async disconnect(): Promise<void> {
    await this.pub.quit();
    await this.sub.quit();
  }
}

// correct rate limit window calculation - revision 15

// extract authentication token parser - revision 59

// optimize trade history pagination - revision 103

// prevent race in trade notification delivery - revision 147
