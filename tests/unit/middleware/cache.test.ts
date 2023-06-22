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
      setHeader: jest.fn(),
      json: jest.fn(),
    };
    mockNext = jest.fn();
  });

  it('should return cached response on HIT', async () => {
    const cachedData = JSON.stringify({ success: true, data: [] });
    mockGet.mockResolvedValue(cachedData);

    const middleware = cacheMiddleware();
    await middleware(mockReq as Request, mockRes as Response, mockNext);

    expect(mockRes.setHeader).toHaveBeenCalledWith('X-Cache', 'HIT');
    expect(mockRes.json).toHaveBeenCalledWith(JSON.parse(cachedData));
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should call next on cache MISS', async () => {
    mockGet.mockResolvedValue(null);

    const middleware = cacheMiddleware();
    await middleware(mockReq as Request, mockRes as Response, mockNext);

    expect(mockNext).toHaveBeenCalled();
  });

  it('should skip caching for non-GET requests', async () => {
    mockReq.method = 'POST';

    const middleware = cacheMiddleware();
    await middleware(mockReq as Request, mockRes as Response, mockNext);

    expect(mockNext).toHaveBeenCalled();
    expect(mockGet).not.toHaveBeenCalled();
  });

  it('should invalidate cache by pattern', async () => {
    mockScan.mockResolvedValue(['0', ['cache:GET:/orders:abc']]);
    mockDel.mockResolvedValue(1);

    await invalidateCache('GET:/orders*');

    expect(mockScan).toHaveBeenCalled();
    expect(mockDel).toHaveBeenCalledWith('cache:GET:/orders:abc');
  });
});
