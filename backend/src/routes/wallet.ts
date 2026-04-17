import { Router } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { portfolioService } from '../services/wallet.service';

const router = Router();

// portföy bilgisi — bakiye + varlıklar + kar/zarar
router.get('/', authMiddleware, async (req, res) => {
  try {
    const authReq = req as AuthRequest;
    const portfolio = await portfolioService.getPortfolio(authReq.user!.userId);
    res.json(portfolio);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
