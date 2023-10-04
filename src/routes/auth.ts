import { Router, Request, Response } from 'express';

const router = Router();

router.post('/login', async (req: Request, res: Response) => {
    const { username, password } = req.body;
    res.json({ token: 'stub' });
});

export default router;
