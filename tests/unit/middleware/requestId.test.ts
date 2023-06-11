import { Request, Response, NextFunction } from 'express';
import { requestIdMiddleware } from '../../../src/middleware/requestId';

jest.mock('uuid', () => ({ v4: () => 'generated-uuid-123' }));

describe('RequestId Middleware', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockReq = { headers: {} };
    mockRes = { setHeader: jest.fn() };
    mockNext = jest.fn();
  });

  it('should generate a request ID if none provided', () => {
    requestIdMiddleware(mockReq as Request, mockRes as Response, mockNext);

    expect(mockReq.headers!['x-request-id']).toBe('generated-uuid-123');
    expect(mockRes.setHeader).toHaveBeenCalledWith('X-Request-Id', 'generated-uuid-123');
    expect(mockNext).toHaveBeenCalled();
  });

  it('should preserve existing request ID', () => {
    mockReq.headers = { 'x-request-id': 'existing-id' };

    requestIdMiddleware(mockReq as Request, mockRes as Response, mockNext);

    expect(mockReq.headers['x-request-id']).toBe('existing-id');
    expect(mockRes.setHeader).toHaveBeenCalledWith('X-Request-Id', 'existing-id');
  });
});

// improve test helper readability - revision 39
