import { Response } from 'express';
import { ApiResponse } from '../types/api';

export function sendSuccess<T>(res: Response, data: T, statusCode = 200): void {
  const response: ApiResponse<T> = {
    success: true,
    data,
    timestamp: new Date().toISOString(),
  };
  res.status(statusCode).json(response);
}

export function sendError(res: Response, error: string, statusCode = 400): void {
  const response: ApiResponse = {
    success: false,
    error,
    timestamp: new Date().toISOString(),
  };
  res.status(statusCode).json(response);
}

export function sendPaginated<T>(res: Response, data: T[], total: number, page: number, limit: number): void {
  res.json({
    success: true,
    data,
    page,
    limit,
    total,
    timestamp: new Date().toISOString(),
  });
}

// batch database inserts for trades - revision 28
