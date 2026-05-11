import { Router } from 'express';
import { authMiddleware, adminMiddleware } from '../middleware/auth.js';
import { adminService } from '../services/admin.service.js';

const router = Router();

router.use(authMiddleware, adminMiddleware);

router.get('/stats', async (_req, res) => {
  try {
    const stats = await adminService.getStats();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/users', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const result = await adminService.getUsers(page, limit);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/assets', async (_req, res) => {
  try {
    const assets = await adminService.getAssets();
    res.json(assets);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.patch('/assets/:id', async (req, res) => {
  try {
    const { name, active } = req.body;
    const asset = await adminService.updateAsset(req.params.id, { name, active });
    res.json(asset);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/assets', async (req, res) => {
  try {
    const { symbol, name, category, unit } = req.body;
    const asset = await adminService.createAsset({ symbol, name, category, unit });
    res.status(201).json(asset);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
