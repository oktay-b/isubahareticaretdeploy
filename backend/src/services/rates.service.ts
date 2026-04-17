import prisma from '../lib/prisma';
import { config } from '../config';

// bellekte tutulan son fiyatlar — hızlı erişim için
let priceCache: Record<string, { buy: number; sell: number }> = {};
let priceHistory: Array<{ timestamp: number; prices: Record<string, { buy: number; sell: number }> }> = [];
const MAX_HISTORY = 120;

// her varlığın volatilite oranı farklı
const volatility: Record<string, number> = {
  ALTIN: 0.003,
  GUMUS: 0.005,
  DOVIZ: 0.002,
  KRIPTO: 0.012,
};

export class PriceService {
  // fiyatları güncelle — simülasyon
  async updatePrices(): Promise<Record<string, { buy: number; sell: number }>> {
    const assets = await prisma.asset.findMany({ where: { active: true } });
    const result: Record<string, { buy: number; sell: number }> = {};

    for (const asset of assets) {
      const assetDef = config.assets.find((a) => a.symbol === asset.symbol);
      if (!assetDef) continue;

      let midPrice: number;

      // önceki fiyat varsa onun üstüne dalgalanma ekle
      if (priceCache[asset.symbol]) {
        const prev = (priceCache[asset.symbol].buy + priceCache[asset.symbol].sell) / 2;
        const vol = volatility[asset.category] || 0.003;
        const change = 1 + (Math.random() - 0.5) * 2 * vol;
        midPrice = prev * change;

        // fiyat çok sapmasın, base'in %20 altına veya %20 üstüne çıkmasın
        const minPrice = assetDef.basePrice * 0.8;
        const maxPrice = assetDef.basePrice * 1.2;
        midPrice = Math.max(minPrice, Math.min(maxPrice, midPrice));
      } else {
        midPrice = assetDef.basePrice;
      }

      const spread = midPrice * config.spreadRate;
      const buyPrice = parseFloat((midPrice + spread).toFixed(4));
      const sellPrice = parseFloat((midPrice - spread).toFixed(4));

      result[asset.symbol] = { buy: buyPrice, sell: sellPrice };

      // db'ye kaydet
      await prisma.price.create({
        data: {
          assetId: asset.id,
          buyPrice,
          sellPrice,
        },
      });
    }

    // cache güncelle
    priceCache = result;

    // tarihçeye ekle
    priceHistory.push({ timestamp: Date.now(), prices: { ...result } });
    if (priceHistory.length > MAX_HISTORY) {
      priceHistory = priceHistory.slice(-MAX_HISTORY);
    }

    return result;
  }

  getCurrentPrices() {
    return { ...priceCache };
  }

  getPriceHistory() {
    return [...priceHistory];
  }

  // belirli bir varlığın son fiyatını getir
  async getAssetPrice(symbol: string): Promise<{ buy: number; sell: number }> {
    if (priceCache[symbol]) {
      return priceCache[symbol];
    }

    // cache'de yoksa db'den son kaydı çek
    const asset = await prisma.asset.findUnique({ where: { symbol } });
    if (!asset) throw new Error(`${symbol} bulunamadı.`);

    const lastPrice = await prisma.price.findFirst({
      where: { assetId: asset.id },
      orderBy: { createdAt: 'desc' },
    });

    if (!lastPrice) {
      const def = config.assets.find((a) => a.symbol === symbol);
      const base = def?.basePrice || 0;
      return { buy: base, sell: base };
    }

    return { buy: Number(lastPrice.buyPrice), sell: Number(lastPrice.sellPrice) };
  }
}

export const priceService = new PriceService();
