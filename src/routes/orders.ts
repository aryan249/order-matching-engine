import { Router } from 'express';

const router = Router();

router.get('/', (req, res) => {
    res.json({ orders: [] });
});

export default router;
