import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { config } from './config.js';
import { initializeSocket } from './socket/index.js';
import authRoutes from './routes/auth.js';
import walletRoutes from './routes/wallet.js';
import transactionRoutes from './routes/transaction.js';
import ratesRoutes from './routes/rates.js';
import adminRoutes from './routes/admin.js';

const app = express();
const httpServer = createServer(app);

app.use(cors({
  origin: config.corsOrigins,
  credentials: true,
}));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/portfolio', walletRoutes);
app.use('/api/trade', transactionRoutes);
app.use('/api/rates', ratesRoutes);
app.use('/api/admin', adminRoutes);

app.get('/api', (_req, res) => {
  res.json({
    message: 'Yatırım Simülatörü API\'sine Hoş Geldiniz!',
    endpoints: [
      '/api/auth',
      '/api/portfolio',
      '/api/trade',
      '/api/rates',
      '/api/admin',
      '/api/health'
    ]
  });
});

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

initializeSocket(httpServer);

httpServer.listen(config.port, () => {
  console.log(`
  Sunucu çalışıyor!
  API: http://localhost:${config.port}/api
  WebSocket: ws://localhost:${config.port}
  Fiyat güncelleme: ${config.priceUpdateInterval / 1000} saniyede bir
  `);
});

export default app;
