import dotenv from 'dotenv';
dotenv.config();

const config = {
  server: {
    port: parseInt(process.env.PORT || '3000', 10),
    env: process.env.NODE_ENV || 'development',
  },
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },
  db: {
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/order_engine',
    poolSize: parseInt(process.env.DB_POOL_SIZE || '10', 10),
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'dev-secret-do-not-use-in-production',
    expiry: process.env.JWT_EXPIRY || '1h',
  },
  batch: {
    windowMs: parseInt(process.env.BATCH_WINDOW_MS || '500', 10),
    chunkSize: parseInt(process.env.BATCH_CHUNK_SIZE || '50', 10),
  },
  cache: {
    ttlSeconds: parseInt(process.env.CACHE_TTL_SECONDS || '60', 10),
  },
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  },
  ws: {
    port: parseInt(process.env.WS_PORT || '3001', 10),
  },
} as const;

if (config.server.env === 'production' && config.jwt.secret === 'dev-secret-do-not-use-in-production') {
  throw new Error('JWT_SECRET must be set in production');
}

export default config;

// handle empty order book in matching - revision 17

// simplify batch execution state machine - revision 61

// handle concurrent WebSocket subscriptions - revision 105
