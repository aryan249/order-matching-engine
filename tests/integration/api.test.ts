import request from 'supertest';
import express from 'express';
import { OrderSide } from '../../src/types/order';

// Mock all external dependencies for integration test of HTTP layer
const mockCreate = jest.fn();
const mockFindById = jest.fn();
const mockFindByUserId = jest.fn();
const mockCancelOrder = jest.fn();
const mockIngest = jest.fn();
const mockGetTradesByOrder = jest.fn();
const mockRemoveOrder = jest.fn();

jest.mock('../../src/config/redis', () => ({
  getRedisClient: () => ({
    incr: jest.fn().mockResolvedValue(1),
    expire: jest.fn().mockResolvedValue(1),
    get: jest.fn().mockResolvedValue(null),
    setex: jest.fn().mockResolvedValue('OK'),
    scan: jest.fn().mockResolvedValue(['0', []]),
    del: jest.fn().mockResolvedValue(0),
    status: 'ready',
  }),
}));

jest.mock('../../src/config/database', () => ({
  query: jest.fn(),
  pool: { query: jest.fn().mockResolvedValue({ rows: [{ '?column?': 1 }] }) },
}));

jest.mock('../../src/config/logger', () => ({
  default: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
  __esModule: true,
}));

process.env.JWT_SECRET = 'test-secret';
process.env.JWT_EXPIRY = '1h';

import { generateToken } from '../../src/utils/jwt';
import { createOrderRoutes } from '../../src/routes/orders';
import { errorHandler } from '../../src/middleware/errorHandler';
import { metricsMiddleware } from '../../src/metrics/prometheus';

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use(metricsMiddleware);

  const orderRoutes = createOrderRoutes(
    { ingest: mockIngest } as any,
    { findById: mockFindById, findByUserId: mockFindByUserId, cancelOrder: mockCancelOrder } as any,
    { getTradesByOrder: mockGetTradesByOrder } as any,
    { removeOrder: mockRemoveOrder } as any
  );

  app.use('/orders', orderRoutes);
  app.use(errorHandler);
  return app;
}

describe('Orders API', () => {
  let app: express.Application;
  let token: string;
  const userId = 'user-123';

  beforeAll(() => {
    app = buildApp();
    token = generateToken({ userId, email: 'test@test.com' });
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('POST /orders - should create an order', async () => {
    const order = {
      id: 'order-1',
      userId,
      asset: 'BTC',
      side: OrderSide.MAKER,
      price: 50000,
      quantity: 1,
      remainingQuantity: 1,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    mockIngest.mockResolvedValue(order);

    const res = await request(app)
      .post('/orders')
      .set('Authorization', `Bearer ${token}`)
      .send({ asset: 'BTC', side: 'maker', price: 50000, quantity: 1 });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBe('order-1');
  });

  it('POST /orders - should return 401 without auth', async () => {
    const res = await request(app).post('/orders').send({ asset: 'BTC', side: 'maker', price: 50000, quantity: 1 });

    expect(res.status).toBe(401);
  });

  it('POST /orders - should return 400 with invalid body', async () => {
    const res = await request(app)
      .post('/orders')
      .set('Authorization', `Bearer ${token}`)
      .send({ asset: 'BTC' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Validation failed');
  });

  it('GET /orders - should return paginated orders', async () => {
    mockFindByUserId.mockResolvedValue({ orders: [], total: 0 });

    const res = await request(app).get('/orders').set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.page).toBe(1);
  });

  it('GET /orders/:id - should return order by id', async () => {
    mockFindById.mockResolvedValue({
      id: 'order-1',
      userId,
      asset: 'BTC',
