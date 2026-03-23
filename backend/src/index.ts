import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { config } from './config';
import { initializeSocket } from './socket';
import authRoutes from './routes/auth';
import walletRoutes from './routes/wallet';
import transactionRoutes from './routes/transaction';
import ratesRoutes from './routes/rates';

const app = express();
const httpServer = createServer(app);

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true,
}));
app.use(express.json());

// Request logging
app.use((req, _res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/wallets', walletRoutes);
app.use('/api/trade', transactionRoutes);
app.use('/api/rates', ratesRoutes);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Initialize WebSocket
initializeSocket(httpServer);

// Start server
httpServer.listen(config.port, () => {
  console.log(`
  🚀 Server is running!
  📡 REST API: http://localhost:${config.port}/api
  🔌 WebSocket: ws://localhost:${config.port}
  💱 Rate updates every ${config.rateFetchInterval / 1000}s
  `);
});

export default app;
