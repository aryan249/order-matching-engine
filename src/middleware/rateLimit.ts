import { Request, Response, NextFunction } from 'express';

const requestCounts = new Map<string, number>();

export function rateLimit(maxRequests: number = 100) {
    return (req: Request, res: Response, next: NextFunction) => {
        const ip = req.ip || 'unknown';
        const count = requestCounts.get(ip) || 0;
        if (count >= maxRequests) {
            return res.status(429).json({ error: 'Too many requests' });
        }
        requestCounts.set(ip, count + 1);
        next();
    };
}
