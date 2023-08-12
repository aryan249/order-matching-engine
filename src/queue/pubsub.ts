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

