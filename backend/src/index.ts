import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { config } from './config';
import { initializeSocket } from './socket';
import authRoutes from './routes/auth';
import walletRoutes from './routes/wallet';
import transactionRoutes from './routes/transaction';
import ratesRoutes from './routes/rates';
import adminRoutes from './routes/admin';

const app = express();
const httpServer = createServer(app);

app.use(cors({
  origin: config.corsOrigins,
  credentials: true,
}));
app.use(express.json());

// istek loglama
app.use((req, _res, next) => {
  console.log(`${new Date().toLocaleTimeString('tr-TR')} ${req.method} ${req.path}`);
  next();
});

// route'lar
app.use('/api/auth', authRoutes);
app.use('/api/portfolio', walletRoutes);
app.use('/api/trade', transactionRoutes);
app.use('/api/rates', ratesRoutes);
app.use('/api/admin', adminRoutes);

// sağlık kontrolü
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
