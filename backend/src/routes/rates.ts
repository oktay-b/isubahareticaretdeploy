import { Router } from 'express';
import { ratesService } from '../services/rates.service';

const router = Router();

// GET /api/rates — Get current exchange rates
router.get('/', async (_req, res) => {
  try {
    const rates = ratesService.getCurrentRates();
    if (Object.keys(rates).length === 0) {
      // First request, fetch fresh
      const freshRates = await ratesService.fetchRates();
      res.json({ rates: freshRates, updatedAt: new Date() });
    } else {
      res.json({ rates, updatedAt: new Date() });
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/rates/history — Get rate history for charts
router.get('/history', async (_req, res) => {
  try {
    const history = ratesService.getRateHistory();
    res.json(history);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
