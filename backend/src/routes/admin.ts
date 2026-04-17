import { Router } from 'express';
import { authMiddleware, adminMiddleware, AuthRequest } from '../middleware/auth';
import { adminService } from '../services/admin.service';

const router = Router();

// tüm route'lar hem auth hem admin kontrolünden geçer
router.use(authMiddleware, adminMiddleware);

// istatistikler
router.get('/stats', async (_req, res) => {
  try {
    const stats = await adminService.getStats();
    res.json(stats);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// kullanıcı listesi
router.get('/users', async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const result = await adminService.getUsers(page, limit);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// varlık listesi
router.get('/assets', async (_req, res) => {
  try {
    const assets = await adminService.getAssets();
    res.json(assets);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// varlık güncelle
router.patch('/assets/:id', async (req, res) => {
  try {
    const { name, active } = req.body;
    const asset = await adminService.updateAsset(req.params.id, { name, active });
    res.json(asset);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// yeni varlık ekle
router.post('/assets', async (req, res) => {
  try {
    const { symbol, name, category, unit } = req.body;
    const asset = await adminService.createAsset({ symbol, name, category, unit });
    res.status(201).json(asset);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
