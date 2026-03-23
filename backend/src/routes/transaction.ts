import { Router } from 'express';
import { z } from 'zod';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { tradeService } from '../services/trade.service';

const router = Router();

const tradeSchema = z.object({
  fromCurrency: z.string().min(1, 'Kaynak döviz gereklidir.'),
  toCurrency: z.string().min(1, 'Hedef döviz gereklidir.'),
  amount: z.number().positive('Miktar pozitif olmalıdır.'),
});

// POST /api/trade/buy — Buy currency
router.post('/buy', authMiddleware, validate(tradeSchema), async (req, res) => {
  try {
    const authReq = req as AuthRequest;
    const { fromCurrency, toCurrency, amount } = req.body;
    const result = await tradeService.buy(authReq.user!.userId, fromCurrency, toCurrency, amount);
    res.status(201).json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// POST /api/trade/sell — Sell currency
router.post('/sell', authMiddleware, validate(tradeSchema), async (req, res) => {
  try {
    const authReq = req as AuthRequest;
    const { fromCurrency, toCurrency, amount } = req.body;
    const result = await tradeService.sell(authReq.user!.userId, fromCurrency, toCurrency, amount);
    res.status(201).json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// GET /api/transactions — Transaction history
router.get('/history', authMiddleware, async (req, res) => {
  try {
    const authReq = req as AuthRequest;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const result = await tradeService.getHistory(authReq.user!.userId, page, limit);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
