import { Pool, PoolClient, QueryResult } from 'pg';
import config from './index';
import logger from './logger';

const pool = new Pool({
  connectionString: config.db.connectionString,
  max: config.db.poolSize,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => {
  logger.error('Unexpected database pool error', { error: err.message });
});

export async function query(text: string, params?: unknown[]): Promise<QueryResult> {
  const start = Date.now();
  const result = await pool.query(text, params);
  const duration = Date.now() - start;

  if (duration > 200) {
    logger.warn('Slow query detected', { text: text.substring(0, 100), duration, rows: result.rowCount });
  }

  return result;
}

export async function getClient(): Promise<PoolClient> {
  return pool.connect();
}

export async function disconnectDb(): Promise<void> {
  await pool.end();
}

export { pool };

// cache compiled validation schemas - revision 18
