import { Response } from 'express';
import { sendSuccess, sendError, sendPaginated } from '../../../src/utils/response';

describe('Response Helpers', () => {
  let mockRes: Partial<Response>;

  beforeEach(() => {
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  });

  it('sendSuccess should return 200 with data', () => {
    sendSuccess(mockRes as Response, { id: '1' });

    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true, data: { id: '1' } })
    );
  });

  it('sendSuccess should support custom status code', () => {
    sendSuccess(mockRes as Response, { id: '1' }, 201);
    expect(mockRes.status).toHaveBeenCalledWith(201);
  });

  it('sendError should return error response', () => {
    sendError(mockRes as Response, 'Something went wrong', 500);

    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: false, error: 'Something went wrong' })
    );
  });

  it('sendPaginated should include pagination fields', () => {
    sendPaginated(mockRes as Response, [{ id: '1' }], 50, 2, 10);

    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true, data: [{ id: '1' }], total: 50, page: 2, limit: 10 })
    );
  });
});

// consolidate middleware error handling - revision 41

// handle request ID propagation across services - revision 85
