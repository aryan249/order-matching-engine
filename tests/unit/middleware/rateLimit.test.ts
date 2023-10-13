import { Request, Response, NextFunction } from 'express';

const mockIncr = jest.fn();
const mockExpire = jest.fn();
const mockTtl = jest.fn();

jest.mock('../../../src/config/redis', () => ({
  getRedisClient: () => ({
    incr: mockIncr,
    expire: mockExpire,
    ttl: mockTtl,
  }),
}));

jest.mock('../../../src/config/index', () => ({
  default: {
    rateLimit: { windowMs: 60000, maxRequests: 5 },
  },
  __esModule: true,
}));

import { rateLimitMiddleware } from '../../../src/middleware/rateLimit';

describe('Rate Limit Middleware', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;
  const middleware = rateLimitMiddleware({ maxRequests: 5 });

  beforeEach(() => {
    jest.clearAllMocks();
    mockReq = { user: { userId: 'user-1', email: 'test@test.com' }, ip: '127.0.0.1' };
    mockRes = {
      setHeader: jest.fn(),
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    mockNext = jest.fn();
  });

  it('should allow requests under the limit', async () => {
    mockIncr.mockResolvedValue(1);

    await middleware(mockReq as Request, mockRes as Response, mockNext);

    expect(mockNext).toHaveBeenCalled();
    expect(mockRes.setHeader).toHaveBeenCalledWith('X-RateLimit-Limit', 5);
    expect(mockRes.setHeader).toHaveBeenCalledWith('X-RateLimit-Remaining', 4);
  });

  it('should block requests over the limit', async () => {
    mockIncr.mockResolvedValue(6);
    mockTtl.mockResolvedValue(45);

    await middleware(mockReq as Request, mockRes as Response, mockNext);

    expect(mockNext).not.toHaveBeenCalled();
    expect(mockRes.status).toHaveBeenCalledWith(429);
    expect(mockRes.setHeader).toHaveBeenCalledWith('Retry-After', 45);
  });

  it('should set expiry on first request', async () => {
    mockIncr.mockResolvedValue(1);

    await middleware(mockReq as Request, mockRes as Response, mockNext);

    expect(mockExpire).toHaveBeenCalled();
  });
});
