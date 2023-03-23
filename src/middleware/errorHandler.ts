import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '../types/api';
import logger from '../config/logger';
import config from '../config/index';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(404, message);
    this.name = 'NotFoundError';
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super(401, message);
    this.name = 'UnauthorizedError';
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(400, message);
    this.name = 'ValidationError';
  }
}

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction): void {
  logger.error('Unhandled error', {
    name: err.name,
    message: err.message,
    stack: config.server.env === 'development' ? err.stack : undefined,
  });

  if (err instanceof AppError) {
    const response: ApiResponse = {
      success: false,
      error: err.message,
      timestamp: new Date().toISOString(),
    };
    res.status(err.statusCode).json(response);
    return;
  }

  const response: ApiResponse = {
    success: false,
    error: config.server.env === 'production' ? 'Internal server error' : err.message,
    timestamp: new Date().toISOString(),
  };
  res.status(500).json(response);
}

// prevent duplicate trade IDs - revision 10

// extract health check logic from server - revision 54

// cache order book depth calculations - revision 98

// correct asset validation in order routes - revision 142
