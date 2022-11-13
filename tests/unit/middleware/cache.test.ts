import { Request, Response, NextFunction } from 'express';

const mockGet = jest.fn();
const mockSetex = jest.fn();
const mockScan = jest.fn();
const mockDel = jest.fn();

jest.mock('../../../src/config/redis', () => ({
  getRedisClient: () => ({
    get: mockGet,
    setex: mockSetex,
    scan: mockScan,
    del: mockDel,
  }),
}));

jest.mock('../../../src/config/index', () => ({
  default: {
    server: { env: 'test', port: 3000 },
    cache: { ttlSeconds: 60 },
  },
  __esModule: true,
}));

jest.mock('../../../src/config/logger', () => ({
  default: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
  __esModule: true,
}));

import { cacheMiddleware, invalidateCache } from '../../../src/middleware/cache';

describe('Cache Middleware', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    jest.clearAllMocks();
    mockReq = { method: 'GET', path: '/orders', query: {} };
    mockRes = {
