import { Router, Request, Response } from 'express';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
    res.json({ orders: [] });
});

router.post('/', async (req: Request, res: Response) => {
    const { asset, side, type, price, quantity } = req.body;
    res.status(201).json({ message: 'Order created' });
});

export default router;
