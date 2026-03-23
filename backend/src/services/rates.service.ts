import axios from 'axios';
import { PrismaClient } from '@prisma/client';
import { config } from '../config';

const prisma = new PrismaClient();

// In-memory rate cache for fast access
let rateCache: Record<string, number> = {};
let rateHistory: Array<{ timestamp: number; rates: Record<string, number> }> = [];
const MAX_HISTORY = 100;

export class RatesService {
  /**
   * Fetch latest exchange rates from ExchangeRate-API
   * Falls back to mock data if API is unreachable
   */
  async fetchRates(): Promise<Record<string, number>> {
    try {
      const apiKey = config.exchangeApiKey;
      let rates: Record<string, number> = {};

      if (apiKey && apiKey !== 'demo') {
        // Use real API
        const response = await axios.get(
          `https://v6.exchangerate-api.com/v6/${apiKey}/latest/USD`,
          { timeout: 5000 }
        );
        const data = response.data;
        if (data.result === 'success') {
          const usdRates = data.conversion_rates;
          // Calculate needed pairs
          rates['USD/TRY'] = usdRates.TRY || 38.5;
          rates['EUR/TRY'] = (usdRates.TRY / usdRates.EUR) || 41.2;
          rates['GBP/TRY'] = (usdRates.TRY / usdRates.GBP) || 48.9;
          rates['USD/EUR'] = usdRates.EUR || 0.93;
        }
      }

      // Use mock/simulated data if no API key or API failed
      if (Object.keys(rates).length === 0) {
        rates = this.generateMockRates();
      }

      // Update database and cache
      await this.updateRatesInDb(rates);
      rateCache = rates;

      // Add to history
      rateHistory.push({ timestamp: Date.now(), rates: { ...rates } });
      if (rateHistory.length > MAX_HISTORY) {
        rateHistory = rateHistory.slice(-MAX_HISTORY);
      }

      return rates;
    } catch (error) {
      console.error('Kur verisi alınamadı:', error);
      // Return cached rates or generate mock
      if (Object.keys(rateCache).length > 0) {
        return rateCache;
      }
      const mockRates = this.generateMockRates();
      rateCache = mockRates;
      return mockRates;
    }
  }

  /**
   * Get current cached rates
   */
  getCurrentRates(): Record<string, number> {
    return { ...rateCache };
  }

  /**
   * Get rate history for charts
   */
  getRateHistory() {
    return [...rateHistory];
  }

  /**
   * Generate realistic mock rates with small random fluctuations
   */
  private generateMockRates(): Record<string, number> {
    const base: Record<string, number> = {
      'USD/TRY': 38.5,
      'EUR/TRY': 41.2,
      'GBP/TRY': 48.9,
      'USD/EUR': 0.93,
    };

    // If we have previous rates, add small fluctuation
    if (Object.keys(rateCache).length > 0) {
      const result: Record<string, number> = {};
      for (const [pair, rate] of Object.entries(rateCache)) {
        // Random fluctuation between -0.5% and +0.5%
        const fluctuation = 1 + (Math.random() - 0.5) * 0.01;
        result[pair] = parseFloat((rate * fluctuation).toFixed(6));
      }
      return result;
    }

    return base;
  }

  /**
   * Update rates in database
   */
  private async updateRatesInDb(rates: Record<string, number>) {
    const upsertPromises = Object.entries(rates).map(([currency, rate]) =>
      prisma.exchangeRate.upsert({
        where: { currency },
        update: { rate, updatedAt: new Date() },
        create: { currency, rate },
      })
    );
    await Promise.all(upsertPromises);
  }
}

export const ratesService = new RatesService();
