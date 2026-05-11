import jwt from 'jsonwebtoken';
import { config } from '../config.js';

export function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Giriş yapmanız gerekiyor.' });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ error: 'Oturumunuz sona erdi, lütfen tekrar giriş yapın.' });
  }
}

export function adminMiddleware(req, res, next) {
  if (!req.user || req.user.role !== 'ADMIN') {
    res.status(403).json({ error: 'Bu işlem için yetkiniz yok.' });
    return;
  }
  next();
}
