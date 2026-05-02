import { Server as HttpServer } from 'http';
import { Server as SocketServer } from 'socket.io';
import { priceService } from '../services/rates.service';
import { config } from '../config';

let io: SocketServer;

// Backend'in { buy, sell } formatını frontend'in beklediği düz sayı formatına dönüştür.
// Frontend rate key formatı: "USD/TRY", "EUR/TRY", "BTC/TRY" vb.
// Backend sembol formatı: "USD", "EUR", "BTC" vb.
function formatPricesForFrontend(
  prices: Record<string, { buy: number; sell: number }>
): Record<string, number> {
  const result: Record<string, number> = {};

  for (const [symbol, { buy, sell }] of Object.entries(prices)) {
    const mid = (buy + sell) / 2;

    // Döviz ve altın sembolleri TRY bazlı — doğrudan /TRY pair'i oluştur
    // Kripto da TRY bazlı
    result[`${symbol}/TRY`] = parseFloat(mid.toFixed(4));
  }

  return result;
}

// Geçmiş formatını da dönüştür
function formatHistoryForFrontend(
  history: Array<{ timestamp: number; prices: Record<string, { buy: number; sell: number }> }>
): Array<{ timestamp: number; rates: Record<string, number> }> {
  return history.map((entry) => ({
    timestamp: entry.timestamp,
    rates: formatPricesForFrontend(entry.prices),
  }));
}

export function initializeSocket(httpServer: HttpServer) {
  io = new SocketServer(httpServer, {
    cors: {
      origin: config.corsOrigins,
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket) => {
    console.log(`Bağlantı: ${socket.id}`);

    // Bağlanan istemciye güncel fiyatları gönder (frontend formatında)
    const current = priceService.getCurrentPrices();
    if (Object.keys(current).length > 0) {
      const rates = formatPricesForFrontend(current);
      socket.emit('rates:update', { rates, timestamp: Date.now() });
    }

    // Fiyat geçmişini gönder
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
  // İlk güncelleme
  priceService.updatePrices().then((prices) => {
    if (io) {
      const rates = formatPricesForFrontend(prices);
      io.emit('rates:update', { rates, timestamp: Date.now() });
    }
  });

  // Periyodik güncelleme (her 10 saniyede bir)
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

