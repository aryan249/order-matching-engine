import { Request, Response, NextFunction } from 'express';

export function cacheMiddleware(ttl: number = 60) {
    return (req: Request, res: Response, next: NextFunction) => {
        // Cache logic
        next();
    };
}
