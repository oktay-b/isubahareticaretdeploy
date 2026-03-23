import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  jwtSecret: process.env.JWT_SECRET || 'fallback-secret-change-me',
  exchangeApiKey: process.env.EXCHANGE_API_KEY || 'demo',
  databaseUrl: process.env.DATABASE_URL || '',
  // Supported currency pairs (base/quote)
  currencyPairs: ['USD/TRY', 'EUR/TRY', 'GBP/TRY', 'USD/EUR'],
  // Default currencies for new user wallets
  defaultCurrencies: ['TRY', 'USD', 'EUR', 'GBP'],
  // Starting balance for new users (in TRY)
  startingBalance: 100000,
  // Rate fetch interval in ms
  rateFetchInterval: 10000,
};
