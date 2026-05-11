import { Router } from 'express';
import { priceService } from '../services/rates.service.js';
import prisma from '../lib/prisma.js';

const router = Router();

router.get('/', async (_req, res) => {
  try {
    let prices = priceService.getCurrentPrices();
    if (Object.keys(prices).length === 0) {
      prices = await priceService.updatePrices();
    }
    res.json({ prices, updatedAt: new Date() });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/history', async (_req, res) => {
  try {
    const history = priceService.getPriceHistory();
    res.json(history);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/assets', async (_req, res) => {
  try {
    const assets = await prisma.asset.findMany({
      where: { active: true },
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
    });
    res.json(assets);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
