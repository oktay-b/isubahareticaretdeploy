import prisma from '../lib/prisma.js';
import { config } from '../config.js';

let priceCache = {};
let priceHistory = [];
const MAX_HISTORY = 120;

let apiFallbackCount = 0;

const TROY_TO_GRAM = 31.1034768;

const GOLD_MULTIPLIERS = {
  GRAM_ALTIN:        1,
  CEYREK_ALTIN:      1.75,
  YARIM_ALTIN:       3.5,
  TAM_ALTIN:         7.0,
  CUMHURIYET_ALTINI: 7.216,
};

async function fetchForexRates() {
  try {
    const res = await fetch('https://open.er-api.com/v6/latest/USD', {
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    const rates = data.rates;
    if (!rates?.TRY) throw new Error('TRY kuru bulunamadı');

    const usdTry = rates.TRY;
    const eurTry = (1 / (rates.EUR || 1)) * usdTry;
    const gbpTry = (1 / (rates.GBP || 1)) * usdTry;
    const xauUsd = rates.XAU ? 1 / rates.XAU : 0;

    return { usdTry, eurTry, gbpTry, xauUsd };
  } catch (err) {
    console.error('[API] Forex çekme hatası:', err.message);
    return null;
  }
}

async function fetchGoldUsd() {
  try {
    const res = await fetch(
      'https://forex-data-feed.swissquote.com/public-quotes/bboquotes/instrument/XAU/USD',
      { signal: AbortSignal.timeout(8000) }
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    const entry = Array.isArray(data) ? data[0] : null;
    const profiles = entry?.spreadProfilePrices || [];
    const standard = profiles.find((p) => p.spreadProfile === 'standard') || profiles[0];
    if (!standard?.bid) throw new Error('XAU bid bulunamadı');
    return standard.bid;
  } catch (err) {
    console.error('[API] Gold USD çekme hatası (Swissquote):', err.message);
    return null;
  }
}

async function fetchSilverUsd() {
  try {
    const res = await fetch(
      'https://forex-data-feed.swissquote.com/public-quotes/bboquotes/instrument/XAG/USD',
      { signal: AbortSignal.timeout(8000) }
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    const entry = Array.isArray(data) ? data[0] : null;
    const profiles = entry?.spreadProfilePrices || [];
    const standard = profiles.find((p) => p.spreadProfile === 'standard') || profiles[0];
    if (!standard?.bid) throw new Error('XAG bid bulunamadı');
    return standard.bid;
  } catch (err) {
    console.error('[API] Silver USD çekme hatası (Swissquote):', err.message);
    return null;
  }
}

let cryptoCache = null;
let cryptoCacheTime = 0;
const CRYPTO_CACHE_TTL = 60_000;

async function fetchCryptoPrices() {
  const now = Date.now();

  if (cryptoCache && now - cryptoCacheTime < CRYPTO_CACHE_TTL) {
    return cryptoCache;
  }

  try {
    const url =
      'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=try';
    const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!data?.bitcoin?.try) throw new Error('Bitcoin fiyatı bulunamadı');
    cryptoCache = { btcTry: data.bitcoin.try, ethTry: data.ethereum?.try || 0 };
    cryptoCacheTime = now;
    return cryptoCache;
  } catch (err) {
    console.error('[API] Kripto çekme hatası:', err.message);
    return cryptoCache || null;
  }
}

function applySpread(mid) {
  const spread = mid * config.spreadRate;
  return {
    buy:  parseFloat((mid + spread).toFixed(4)),
    sell: parseFloat((mid - spread).toFixed(4)),
  };
}

export class PriceService {
  async updatePrices() {
    const assets = await prisma.asset.findMany({ where: { active: true } });
    const result = {};

    const [forex, cryptoPrices] = await Promise.all([
      fetchForexRates(),
      fetchCryptoPrices(),
    ]);

    let xauUsd = forex?.xauUsd || 0;
    let xagUsd = 0;

    const [goldFetch, silverFetch] = await Promise.all([
      xauUsd ? Promise.resolve(xauUsd) : fetchGoldUsd(),
      fetchSilverUsd(),
    ]);
    if (goldFetch)  xauUsd = goldFetch;
    if (silverFetch) xagUsd = silverFetch;

    const usdTry = forex?.usdTry || 0;

    const gramGoldTry   = xauUsd && usdTry ? (xauUsd   / TROY_TO_GRAM) * usdTry : 0;
    const gramSilverTry = xagUsd && usdTry ? (xagUsd   / TROY_TO_GRAM) * usdTry : 0;

    for (const asset of assets) {
      const assetDef = config.assets.find((a) => a.symbol === asset.symbol);
      if (!assetDef) continue;

      let mid = 0;

      switch (asset.symbol) {
        case 'USD':
          mid = forex?.usdTry || 0;
          break;
        case 'EUR':
          mid = forex?.eurTry || 0;
          break;
        case 'GBP':
          mid = forex?.gbpTry || 0;
          break;

        case 'GRAM_ALTIN':
        case 'CEYREK_ALTIN':
        case 'YARIM_ALTIN':
        case 'TAM_ALTIN':
        case 'CUMHURIYET_ALTINI': {
          const mult = GOLD_MULTIPLIERS[asset.symbol] || 1;
          mid = gramGoldTry ? gramGoldTry * mult : 0;
          break;
        }

        case 'GRAM_GUMUS':
          mid = gramSilverTry || 0;
          break;

        case 'BTC':
          mid = cryptoPrices?.btcTry || 0;
          break;
        case 'ETH':
          mid = cryptoPrices?.ethTry || 0;
          break;

        default:
          break;
      }

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

      await prisma.price.create({
        data: {
          assetId: asset.id,
          buyPrice:  result[asset.symbol].buy,
          sellPrice: result[asset.symbol].sell,
        },
      });
    }

    priceCache = result;
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

  async getAssetPrice(symbol) {
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
