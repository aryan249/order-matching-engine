import dotenv from 'dotenv';
dotenv.config();

import fs from 'fs';
import path from 'path';
import config from './config/index';
import logger from './config/logger';
import { query, disconnectDb } from './config/database';
import { disconnectRedis } from './config/redis';
import { createApp } from './app';
import { OrderRepository } from './repositories/orderRepository';
import { TradeRepository } from './repositories/tradeRepository';
import { RedisQueue } from './queue/redisQueue';
import { RedisPubSub } from './queue/pubsub';
import { OrderIngestionService } from './services/orderIngestion';
import { OrderMatchingService } from './services/orderMatching';
import { BatchExecutionService } from './services/batchExecution';
import { TradeService } from './services/tradeService';
import { NotificationService } from './services/notificationService';
import { WsServer } from './websocket/wsServer';
import { createOrderRoutes } from './routes/orders';

async function runMigrations(): Promise<void> {
  const migrationsDir = path.join(__dirname, 'db', 'migrations');
  if (!fs.existsSync(migrationsDir)) return;

  const files = fs.readdirSync(migrationsDir).filter((f) => f.endsWith('.sql')).sort();
  for (const file of files) {
    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf-8');
    await query(sql);
    logger.info(`Migration applied: ${file}`);
  }
}

async function bootstrap(): Promise<void> {
  logger.info('Starting order matching engine...');

  await runMigrations();
  logger.info('Database migrations complete');

  const orderRepo = new OrderRepository();
  const tradeRepo = new TradeRepository();
  const redisQueue = new RedisQueue();
  const pubsub = new RedisPubSub();

  const orderIngestion = new OrderIngestionService(orderRepo, redisQueue, pubsub);
  const orderMatching = new OrderMatchingService(redisQueue, pubsub, orderRepo);
  const batchExecution = new BatchExecutionService(tradeRepo, orderRepo, pubsub);
  const tradeService = new TradeService(tradeRepo);
  const notificationService = new NotificationService(pubsub);
