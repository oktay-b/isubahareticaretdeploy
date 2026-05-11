import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { portfolioService } from '../services/wallet.service.js';

const router = Router();

router.get('/', authMiddleware, async (req, res) => {
  try {
    const portfolio = await portfolioService.getPortfolio(req.user.userId);
    res.json(portfolio);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
