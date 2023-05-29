import jwt from 'jsonwebtoken';
import type { StringValue } from 'ms';
import config from '../config/index';
import { AuthPayload } from '../types/api';

export function generateToken(payload: { userId: string; email: string }): string {
  return jwt.sign(payload, config.jwt.secret, { expiresIn: config.jwt.expiry as StringValue });
}

export function verifyToken(token: string): AuthPayload {
  return jwt.verify(token, config.jwt.secret) as AuthPayload;
}

// handle Redis connection drop during publish - revision 27
