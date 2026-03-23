import { Server as HttpServer } from 'http';
import { Server as SocketServer } from 'socket.io';
import { ratesService } from '../services/rates.service';
import { config } from '../config';

let io: SocketServer;

export function initializeSocket(httpServer: HttpServer) {
  io = new SocketServer(httpServer, {
    cors: {
      origin: ['http://localhost:3000', 'http://localhost:3001'],
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket) => {
    console.log(`🔌 Client connected: ${socket.id}`);

    // Send current rates immediately on connection
    const currentRates = ratesService.getCurrentRates();
    if (Object.keys(currentRates).length > 0) {
      socket.emit('rates:update', {
        rates: currentRates,
        timestamp: Date.now(),
      });
    }

    // Send rate history for charts
    const history = ratesService.getRateHistory();
    if (history.length > 0) {
      socket.emit('rates:history', history);
    }

    socket.on('disconnect', () => {
      console.log(`🔌 Client disconnected: ${socket.id}`);
    });
  });

  // Start periodic rate fetching and broadcasting
  startRateBroadcast();

  return io;
}

/**
 * Periodically fetch rates and broadcast to all connected clients
 */
function startRateBroadcast() {
  // Fetch immediately
  ratesService.fetchRates().then((rates) => {
    if (io) {
      io.emit('rates:update', { rates, timestamp: Date.now() });
    }
  });

  // Then every N seconds
  setInterval(async () => {
    try {
      const rates = await ratesService.fetchRates();
      if (io) {
        io.emit('rates:update', { rates, timestamp: Date.now() });
      }
    } catch (error) {
      console.error('Rate broadcast hatası:', error);
    }
  }, config.rateFetchInterval);
}

export { io };
