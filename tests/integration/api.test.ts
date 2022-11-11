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
