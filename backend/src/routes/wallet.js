import { Router } from 'express';
import { z } from 'zod';
import { authMiddleware } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { portfolioService } from '../services/wallet.service.js';

const router = Router();

const depositSchema = z.object({
  amount: z
    .number({ invalid_type_error: 'Geçerli bir tutar girin.' })
    .positive('Tutar 0\'dan büyük olmalı.')
    .min(100, 'Minimum yükleme tutarı 100 ₺.')
    .max(1_000_000, 'Maksimum yükleme tutarı 1.000.000 ₺.'),
});

router.get('/', authMiddleware, async (req, res) => {
  try {
    const portfolio = await portfolioService.getPortfolio(req.user.userId);
    res.json(portfolio);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/deposit', authMiddleware, validate(depositSchema), async (req, res) => {
  try {
    const result = await portfolioService.deposit(req.user.userId, req.body.amount);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
