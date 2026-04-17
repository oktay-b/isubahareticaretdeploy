import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  jwtSecret: process.env.JWT_SECRET || 'fallback-secret-degistir-beni',
  corsOrigins: (process.env.CORS_ORIGINS || 'http://localhost:3000,http://localhost:3001').split(','),
  databaseUrl: process.env.DATABASE_URL || 'file:./dev.db',

  // yeni kullanıcıya verilen başlangıç TRY bakiyesi
  startingBalance: 100000,

  // fiyat güncelleme aralığı (ms)
  priceUpdateInterval: 10000,

  // spread oranı — alış/satış farkı (binde)
  spreadRate: 0.005,

  // varlık tanımları — seed için
  assets: [
    // altın
    { symbol: 'GRAM_ALTIN', name: 'Gram Altın', category: 'ALTIN', unit: 'gram', basePrice: 3150 },
    { symbol: 'CEYREK_ALTIN', name: 'Çeyrek Altın', category: 'ALTIN', unit: 'adet', basePrice: 5200 },
    { symbol: 'YARIM_ALTIN', name: 'Yarım Altın', category: 'ALTIN', unit: 'adet', basePrice: 10400 },
    { symbol: 'TAM_ALTIN', name: 'Tam Altın', category: 'ALTIN', unit: 'adet', basePrice: 20800 },
    { symbol: 'CUMHURIYET_ALTINI', name: 'Cumhuriyet Altını', category: 'ALTIN', unit: 'adet', basePrice: 22000 },

    // gümüş
    { symbol: 'GRAM_GUMUS', name: 'Gram Gümüş', category: 'GUMUS', unit: 'gram', basePrice: 38 },

    // döviz
    { symbol: 'USD', name: 'Amerikan Doları', category: 'DOVIZ', unit: 'birim', basePrice: 38.50 },
    { symbol: 'EUR', name: 'Euro', category: 'DOVIZ', unit: 'birim', basePrice: 41.20 },
    { symbol: 'GBP', name: 'İngiliz Sterlini', category: 'DOVIZ', unit: 'birim', basePrice: 48.90 },

    // kripto
    { symbol: 'BTC', name: 'Bitcoin', category: 'KRIPTO', unit: 'birim', basePrice: 2850000 },
    { symbol: 'ETH', name: 'Ethereum', category: 'KRIPTO', unit: 'birim', basePrice: 115000 },
  ],
};
