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
