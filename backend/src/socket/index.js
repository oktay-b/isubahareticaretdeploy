import { Server as SocketServer } from 'socket.io';
import { priceService } from '../services/rates.service.js';
import { config } from '../config.js';

let io;

function formatPricesForFrontend(prices) {
  const result = {};

  for (const [symbol, { buy, sell }] of Object.entries(prices)) {
    const mid = (buy + sell) / 2;
    result[`${symbol}/TRY`] = parseFloat(mid.toFixed(4));
  }

  return result;
}

function formatHistoryForFrontend(history) {
  return history.map((entry) => ({
    timestamp: entry.timestamp,
    rates: formatPricesForFrontend(entry.prices),
  }));
}

export function initializeSocket(httpServer) {
  io = new SocketServer(httpServer, {
    cors: {
      origin: config.corsOrigins,
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket) => {
    console.log(`Bağlantı: ${socket.id}`);

    const current = priceService.getCurrentPrices();
    if (Object.keys(current).length > 0) {
      const rates = formatPricesForFrontend(current);
      socket.emit('rates:update', { rates, timestamp: Date.now() });
    }

    const history = priceService.getPriceHistory();
    if (history.length > 0) {
      socket.emit('rates:history', formatHistoryForFrontend(history));
    }

    socket.on('disconnect', () => {
      console.log(`Bağlantı kesildi: ${socket.id}`);
    });
  });

  startPriceBroadcast();
  return io;
}

function startPriceBroadcast() {
  priceService.updatePrices().then((prices) => {
    if (io) {
      const rates = formatPricesForFrontend(prices);
      io.emit('rates:update', { rates, timestamp: Date.now() });
    }
  });

  setInterval(async () => {
    try {
      const prices = await priceService.updatePrices();
      if (io) {
        const rates = formatPricesForFrontend(prices);
        io.emit('rates:update', { rates, timestamp: Date.now() });
      }
    } catch (err) {
      console.error('Fiyat yayını hatası:', err);
    }
  }, config.priceUpdateInterval);
}

export { io };
