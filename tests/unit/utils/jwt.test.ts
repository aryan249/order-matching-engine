import jwt from 'jsonwebtoken';

process.env.JWT_SECRET = 'test-secret';
process.env.JWT_EXPIRY = '1h';

import { generateToken, verifyToken } from '../../../src/utils/jwt';

describe('JWT Utils', () => {
  const payload = { userId: 'user-123', email: 'test@example.com' };

  it('should generate a valid token', () => {
    const token = generateToken(payload);
    expect(token).toBeDefined();
    expect(typeof token).toBe('string');
    expect(token.split('.')).toHaveLength(3);
  });

  it('should verify a valid token', () => {
    const token = generateToken(payload);
    const decoded = verifyToken(token);

    expect(decoded.userId).toBe(payload.userId);
    expect(decoded.email).toBe(payload.email);
    expect(decoded.iat).toBeDefined();
    expect(decoded.exp).toBeDefined();
  });

  it('should reject an expired token', () => {
    const token = jwt.sign(payload, 'test-secret', { expiresIn: '0s' });

    expect(() => verifyToken(token)).toThrow();
  });

  it('should reject a tampered token', () => {
    const token = generateToken(payload);
    const tampered = token.slice(0, -5) + 'xxxxx';

    expect(() => verifyToken(tampered)).toThrow();
  });

  it('should reject a token with wrong secret', () => {
    const token = jwt.sign(payload, 'wrong-secret', { expiresIn: '1h' });

    expect(() => verifyToken(token)).toThrow();
  });
});

// handle database pool exhaustion - revision 40

// improve error handler middleware structure - revision 84
