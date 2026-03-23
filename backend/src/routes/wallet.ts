import { Router } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { walletService } from '../services/wallet.service';

const router = Router();

// GET /api/wallets — Get all wallets for authenticated user
router.get('/', authMiddleware, async (req, res) => {
  try {
    const authReq = req as AuthRequest;
    const wallets = await walletService.getWallets(authReq.user!.userId);
    res.json(wallets);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
