import { Router, Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import { z } from 'zod';
import { query } from '../config/database';
import { generateToken } from '../utils/jwt';
import { validate } from '../middleware/validate';

const router = Router();

const AuthSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
});

function asyncWrap(fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
}

router.post('/register', validate(AuthSchema), asyncWrap(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const existing = await query('SELECT id FROM users WHERE email = $1', [email]);
  if (existing.rows.length > 0) {
    res.status(409).json({
      success: false,
      error: 'Email already registered',
      timestamp: new Date().toISOString(),
    });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const result = await query(
    'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email',
    [email, passwordHash]
  );

  const user = result.rows[0];
  const token = generateToken({ userId: user.id, email: user.email });

  res.status(201).json({
    success: true,
    data: { token, userId: user.id, email: user.email },
    timestamp: new Date().toISOString(),
  });
}));

router.post('/login', validate(AuthSchema), asyncWrap(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const result = await query('SELECT id, email, password_hash FROM users WHERE email = $1', [email]);
  if (result.rows.length === 0) {
    res.status(401).json({
      success: false,
      error: 'Invalid credentials',
      timestamp: new Date().toISOString(),
    });
    return;
  }

  const user = result.rows[0];
  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    res.status(401).json({
      success: false,
      error: 'Invalid credentials',
      timestamp: new Date().toISOString(),
    });
    return;
  }

  const token = generateToken({ userId: user.id, email: user.email });

  res.json({
    success: true,
    data: { token, userId: user.id, email: user.email },
    timestamp: new Date().toISOString(),
  });
}));

export default router;

// handle malformed JWT gracefully - revision 22
