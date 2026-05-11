import { Router } from 'express';
import { z } from 'zod';
import { authMiddleware } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { tradeService } from '../services/trade.service.js';

const router = Router();

const tradeSchema = z.object({
  symbol: z.string().min(1, 'Varlık seçiniz.'),
  quantity: z.number().positive('Miktar sıfırdan büyük olmalı.'),
});

router.post('/buy', authMiddleware, validate(tradeSchema), async (req, res) => {
  try {
    const { symbol, quantity } = req.body;
    const result = await tradeService.buy(req.user.userId, symbol, quantity);
    res.status(201).json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/sell', authMiddleware, validate(tradeSchema), async (req, res) => {
  try {
    const { symbol, quantity } = req.body;
    const result = await tradeService.sell(req.user.userId, symbol, quantity);
    res.status(201).json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/history', authMiddleware, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const result = await tradeService.getHistory(req.user.userId, page, limit);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
