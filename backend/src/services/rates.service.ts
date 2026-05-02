import prisma from '../lib/prisma';
import { config } from '../config';

// ─── Tip tanımları ────────────────────────────────────────────────────────────

interface PriceMap {
  [symbol: string]: { buy: number; sell: number };
}

interface HistoryEntry {
  timestamp: number;
  prices: PriceMap;
}

// ─── Bellek önbelleği ─────────────────────────────────────────────────────────

let priceCache: PriceMap = {};
let priceHistory: HistoryEntry[] = [];
const MAX_HISTORY = 120;

// API başarısız olursa kaç kez simülasyonla doldurulsun
let apiFallbackCount = 0;

// ─── Altın katsayıları (gram / troy ons) ─────────────────────────────────────
// 1 Troy ons = 31.1034768 gram
const TROY_TO_GRAM = 31.1034768;

// Altın türlerine göre gram ağırlıkları (yaklaşık)
const GOLD_MULTIPLIERS: Record<string, number> = {
  GRAM_ALTIN:        1,       // 1 gram
  CEYREK_ALTIN:      1.75,    // çeyrek altın ≈ 1.75 gram
  YARIM_ALTIN:       3.5,     // yarım altın ≈ 3.5 gram
  TAM_ALTIN:         7.0,     // tam altın ≈ 7 gram
  CUMHURIYET_ALTINI: 7.216,   // Cumhuriyet altını ≈ 7.216 gram (22 ayar)
};

// ─── Dış API çağrıları ────────────────────────────────────────────────────────

/**
 * open.er-api.com — ücretsiz, API key gerektirmez
 * Döner: { TRY, EUR, GBP, XAU, ... } — tümü USD bazlı
 */
async function fetchForexRates(): Promise<{
  usdTry: number;
  eurTry: number;
  gbpTry: number;
  xauUsd: number; // 1 troy ons altın fiyatı USD cinsinden
} | null> {
  try {
    const res = await fetch('https://open.er-api.com/v6/latest/USD', {
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data: any = await res.json();

    const rates = data.rates as Record<string, number>;
    if (!rates?.TRY) throw new Error('TRY kuru bulunamadı');

    const usdTry = rates.TRY;
    // EUR ve GBP: USD bazlı, TRY'ye çevir
    const eurTry = (1 / (rates.EUR || 1)) * usdTry;
    const gbpTry = (1 / (rates.GBP || 1)) * usdTry;
    // XAU genelde bu API'de olmaz; ayrı çekeceğiz
    const xauUsd = rates.XAU ? 1 / rates.XAU : 0;

    return { usdTry, eurTry, gbpTry, xauUsd };
  } catch (err: any) {
    console.error('[API] Forex çekme hatası:', err.message);
    return null;
  }
}

/**
 * Swissquote Public Feed — XAU/USD (altın troy ons fiyatı)
 */
async function fetchGoldUsd(): Promise<number | null> {
  try {
    const res = await fetch(
      'https://forex-data-feed.swissquote.com/public-quotes/bboquotes/instrument/XAU/USD',
      { signal: AbortSignal.timeout(8000) }
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data: any = await res.json();

    const entry = Array.isArray(data) ? data[0] : null;
    const profiles: any[] = entry?.spreadProfilePrices || [];
    const standard = profiles.find((p: any) => p.spreadProfile === 'standard') || profiles[0];
    if (!standard?.bid) throw new Error('XAU bid bulunamadı');
    return standard.bid as number;
  } catch (err: any) {
    console.error('[API] Gold USD çekme hatası (Swissquote):', err.message);
    return null;
  }
}

/**
 * Swissquote Public Feed — XAG/USD (gümüş troy ons fiyatı)
 */
async function fetchSilverUsd(): Promise<number | null> {
  try {
    const res = await fetch(
      'https://forex-data-feed.swissquote.com/public-quotes/bboquotes/instrument/XAG/USD',
      { signal: AbortSignal.timeout(8000) }
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data: any = await res.json();

    const entry = Array.isArray(data) ? data[0] : null;
    const profiles: any[] = entry?.spreadProfilePrices || [];
    const standard = profiles.find((p: any) => p.spreadProfile === 'standard') || profiles[0];
    if (!standard?.bid) throw new Error('XAG bid bulunamadı');
    return standard.bid as number;
  } catch (err: any) {
    console.error('[API] Silver USD çekme hatası (Swissquote):', err.message);
    return null;
  }
}

// Kripto önbelleği — CoinGecko rate limit koruması için 60sn'de bir güncellenir
let cryptoCache: { btcTry: number; ethTry: number } | null = null;
let cryptoCacheTime = 0;
const CRYPTO_CACHE_TTL = 60_000; // 60 saniye

/**
 * CoinGecko — ücretsiz demo, API key opsiyonel
 * BTC ve ETH fiyatını TRY cinsinden döner.
 * Rate limit (429) koruma: 60 saniyede bir çeker, arada önbellekten döner.
 */
async function fetchCryptoPrices(): Promise<{
  btcTry: number;
  ethTry: number;
} | null> {
  const now = Date.now();

  // Önbellekte taze veri varsa API'ye istek atmadan döndür
  if (cryptoCache && now - cryptoCacheTime < CRYPTO_CACHE_TTL) {
    return cryptoCache;
  }

  try {
    const url =
      'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=try';
    const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data: any = await res.json();
    if (!data?.bitcoin?.try) throw new Error('Bitcoin fiyatı bulunamadı');
    cryptoCache = { btcTry: data.bitcoin.try, ethTry: data.ethereum?.try || 0 };
    cryptoCacheTime = now;
    return cryptoCache;
  } catch (err: any) {
    console.error('[API] Kripto çekme hatası:', err.message);
    // Hata durumunda eski önbelleği kullan
    return cryptoCache || null;
  }
}

// ─── Yardımcı: spread uygula ──────────────────────────────────────────────────

function applySpread(mid: number): { buy: number; sell: number } {
  const spread = mid * config.spreadRate;
  return {
    buy:  parseFloat((mid + spread).toFixed(4)),
    sell: parseFloat((mid - spread).toFixed(4)),
  };
}

// ─── Simülasyon fallback ──────────────────────────────────────────────────────

function simulateFallback(current: PriceMap): PriceMap {
  const volatility: Record<string, number> = {
    ALTIN: 0.003, GUMUS: 0.005, DOVIZ: 0.002, KRIPTO: 0.012,
  };
  const result: PriceMap = {};
  for (const [symbol, prices] of Object.entries(current)) {
    const assetDef = config.assets.find((a) => a.symbol === symbol);
    if (!assetDef) continue;
    const vol = volatility[assetDef.category] || 0.003;
    const mid = (prices.buy + prices.sell) / 2;
    const change = 1 + (Math.random() - 0.5) * 2 * vol;
    const newMid = Math.max(
      assetDef.basePrice * 0.8,
      Math.min(assetDef.basePrice * 1.2, mid * change)
    );
    result[symbol] = applySpread(newMid);
  }
  return result;
}

// ─── Ana servis sınıfı ────────────────────────────────────────────────────────

export class PriceService {
  /**
   * Tüm varlıkların fiyatlarını günceller.
   * Önce gerçek API'lerden çeker; başarısız olursa simülasyona düşer.
   */
  async updatePrices(): Promise<PriceMap> {
    const assets = await prisma.asset.findMany({ where: { active: true } });
    const result: PriceMap = {};

    // ── 1. Paralel API çağrıları ──────────────────────────────────────────────
    const [forex, cryptoPrices] = await Promise.all([
      fetchForexRates(),
      fetchCryptoPrices(),
    ]);

    // ── 2. Altın ve gümüş fiyatlarını çek ──────────────────────────────────────
    // Önce open.er-api'den XAU kontrolu yap, yoksa Swissquote'tan çek
    let xauUsd = forex?.xauUsd || 0;  // open.er-api genelde XAU vermez
    let xagUsd = 0;

    // Altın ve gümüşü paralel çek (her ikisi Swissquote)
    const [goldFetch, silverFetch] = await Promise.all([
      xauUsd ? Promise.resolve(xauUsd) : fetchGoldUsd(),
      fetchSilverUsd(),
    ]);
    if (goldFetch)  xauUsd = goldFetch;
    if (silverFetch) xagUsd = silverFetch;

    const usdTry = forex?.usdTry || 0;

    // 1 gram altın TRY = (troy ons USD / 31.1034) × USD/TRY
    const gramGoldTry   = xauUsd && usdTry ? (xauUsd   / TROY_TO_GRAM) * usdTry : 0;
    // 1 gram gümüş TRY = (troy ons USD / 31.1034) × USD/TRY
    const gramSilverTry = xagUsd && usdTry ? (xagUsd   / TROY_TO_GRAM) * usdTry : 0;

    // ── 2. Varlık başına fiyat hesapla ───────────────────────────────────────
    for (const asset of assets) {
      const assetDef = config.assets.find((a) => a.symbol === asset.symbol);
      if (!assetDef) continue;

      let mid = 0;

      switch (asset.symbol) {
        // Döviz
        case 'USD':
          mid = forex?.usdTry || 0;
          break;
        case 'EUR':
          mid = forex?.eurTry || 0;
          break;
        case 'GBP':
          mid = forex?.gbpTry || 0;
          break;

        // Altın türleri
        case 'GRAM_ALTIN':
        case 'CEYREK_ALTIN':
        case 'YARIM_ALTIN':
        case 'TAM_ALTIN':
        case 'CUMHURIYET_ALTINI': {
          const mult = GOLD_MULTIPLIERS[asset.symbol] || 1;
          mid = gramGoldTry ? gramGoldTry * mult : 0;
          break;
        }

        // Gümüş — Gerçek XAG/USD üzerinden hesapla
        case 'GRAM_GUMUS':
          mid = gramSilverTry || 0;
          break;

        // Kripto
        case 'BTC':
          mid = cryptoPrices?.btcTry || 0;
          break;
        case 'ETH':
          mid = cryptoPrices?.ethTry || 0;
          break;

        default:
          break;
      }

      // API başarısız olduysa — önbellekteki son fiyatı simüle et
      if (!mid || mid <= 0) {
        if (priceCache[asset.symbol]) {
          const prev = (priceCache[asset.symbol].buy + priceCache[asset.symbol].sell) / 2;
          const vol = 0.003;
          mid = prev * (1 + (Math.random() - 0.5) * 2 * vol);
        } else {
          mid = assetDef.basePrice;
        }
        apiFallbackCount++;
      }

      result[asset.symbol] = applySpread(mid);

      // DB'ye kaydet
      await prisma.price.create({
        data: {
          assetId: asset.id,
          buyPrice:  result[asset.symbol].buy,
          sellPrice: result[asset.symbol].sell,
        },
      });
    }

    // ── 3. Önbellek & geçmiş ─────────────────────────────────────────────────
    priceCache = result;
    priceHistory.push({ timestamp: Date.now(), prices: { ...result } });
    if (priceHistory.length > MAX_HISTORY) {
      priceHistory = priceHistory.slice(-MAX_HISTORY);
    }

    // Kaynak bilgisini logla
    const sources: string[] = [];
    if (forex)        sources.push('Forex(open.er-api.com)');
    if (xauUsd)       sources.push('Gold(Swissquote)');
    if (xagUsd)       sources.push('Silver(Swissquote)');
    if (cryptoPrices) sources.push('Crypto(CoinGecko)');
    console.log(
      `[Fiyat] Güncellendi — ${sources.join(', ') || 'Simülasyon'} | USD/TRY: ${usdTry.toFixed(2)} | XAU/USD: ${xauUsd.toFixed(2)} | XAG/USD: ${xagUsd.toFixed(3)} | 1g Altın: ${gramGoldTry.toFixed(2)} ₺ | 1g Gümüş: ${gramSilverTry.toFixed(2)} ₺ | BTC/TRY: ${cryptoPrices?.btcTry?.toLocaleString('tr-TR') || 'N/A'}`
    );

    return result;
  }

  getCurrentPrices(): PriceMap {
    return { ...priceCache };
  }

  getPriceHistory(): HistoryEntry[] {
    return [...priceHistory];
  }

  async getAssetPrice(symbol: string): Promise<{ buy: number; sell: number }> {
    if (priceCache[symbol]) return priceCache[symbol];

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
