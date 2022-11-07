import { Request, Response, NextFunction } from 'express';

process.env.JWT_SECRET = 'test-secret';
process.env.JWT_EXPIRY = '1h';

import { authMiddleware } from '../../../src/middleware/auth';
import { generateToken } from '../../../src/utils/jwt';

describe('Auth Middleware', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: jest.Mock;

  beforeEach(() => {
    mockReq = { headers: {} };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    mockNext = jest.fn();
  });

  it('should pass with a valid token', () => {
    const token = generateToken({ userId: 'user-1', email: 'test@test.com' });
    mockReq.headers = { authorization: `Bearer ${token}` };

    authMiddleware(mockReq as Request, mockRes as Response, mockNext);

    expect(mockNext).toHaveBeenCalledWith();
    expect(mockReq.user).toBeDefined();
    expect(mockReq.user!.userId).toBe('user-1');
  });

  it('should call next with error on missing authorization header', () => {
    mockReq.headers = {};
