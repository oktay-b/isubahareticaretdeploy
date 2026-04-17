import { Server as HttpServer } from 'http';
import { Server as SocketServer } from 'socket.io';
import { priceService } from '../services/rates.service';
import { config } from '../config';

let io: SocketServer;

export function initializeSocket(httpServer: HttpServer) {
  io = new SocketServer(httpServer, {
    cors: {
      origin: config.corsOrigins,
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket) => {
    console.log(`Bağlantı: ${socket.id}`);

    // bağlanan istemciye güncel fiyatları gönder
    const current = priceService.getCurrentPrices();
    if (Object.keys(current).length > 0) {
      socket.emit('prices:update', { prices: current, timestamp: Date.now() });
    }

    const history = priceService.getPriceHistory();
    if (history.length > 0) {
      socket.emit('prices:history', history);
    }

    socket.on('disconnect', () => {
      console.log(`Bağlantı kesildi: ${socket.id}`);
    });
  });

  startPriceBroadcast();
  return io;
}

function startPriceBroadcast() {
  // ilk güncelleme
  priceService.updatePrices().then((prices) => {
    if (io) io.emit('prices:update', { prices, timestamp: Date.now() });
  });

  // periyodik güncelleme
  setInterval(async () => {
    try {
      const prices = await priceService.updatePrices();
      if (io) {
        io.emit('prices:update', { prices, timestamp: Date.now() });
      }
    } catch (err) {
      console.error('Fiyat yayını hatası:', err);
    }
  }, config.priceUpdateInterval);
}

export { io };
