import prisma from '../lib/prisma';
import { priceService } from './rates.service';

export class PortfolioService {
  // kullanıcının tüm varlıklarını getir — canlı kar/zarar ile
  async getPortfolio(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { balance: true },
    });
    if (!user) throw new Error('Kullanıcı bulunamadı.');

    const holdings = await prisma.holding.findMany({
      where: { userId },
      include: { asset: { select: { symbol: true, name: true, category: true, unit: true } } },
    });

    let totalValue = Number(user.balance); // TRY bakiye dahil

    const items = await Promise.all(
      holdings.map(async (h) => {
        const qty = Number(h.quantity);
        const avg = Number(h.avgCost);

        let currentPrice = { buy: avg, sell: avg };
        try {
          currentPrice = await priceService.getAssetPrice(h.asset.symbol);
        } catch {}

        const marketValue = qty * currentPrice.sell;
        const costBasis = qty * avg;
        const pnl = marketValue - costBasis;
        const pnlPct = costBasis > 0 ? (pnl / costBasis) * 100 : 0;

        totalValue += marketValue;

        return {
          id: h.id,
          asset: h.asset,
          quantity: qty,
          avgCost: avg,
          currentPrice: currentPrice.sell,
          marketValue: parseFloat(marketValue.toFixed(2)),
          pnl: parseFloat(pnl.toFixed(2)),
          pnlPct: parseFloat(pnlPct.toFixed(2)),
        };
      })
    );

    return {
      balance: Number(user.balance),
      totalValue: parseFloat(totalValue.toFixed(2)),
      holdings: items,
    };
  }
}

export const portfolioService = new PortfolioService();
