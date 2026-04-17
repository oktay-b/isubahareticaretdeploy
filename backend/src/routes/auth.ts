import { Router } from 'express';
import { z } from 'zod';
import { authService } from '../services/auth.service';
import { validate } from '../middleware/validate';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

const registerSchema = z.object({
  name: z.string().min(2, 'İsim en az 2 karakter olmalı.'),
  email: z.string().email('Geçerli bir e-posta giriniz.'),
  password: z.string().min(6, 'Şifre en az 6 karakter olmalı.'),
});

const loginSchema = z.object({
  email: z.string().email('Geçerli bir e-posta giriniz.'),
  password: z.string().min(1, 'Şifre giriniz.'),
});

router.post('/register', validate(registerSchema), async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const result = await authService.register(name, email, password);
    res.status(201).json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/login', validate(loginSchema), async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await authService.login(email, password);
    res.json(result);
  } catch (error: any) {
    res.status(401).json({ error: error.message });
  }
});

router.get('/me', authMiddleware, async (req, res) => {
  try {
    const authReq = req as AuthRequest;
    const user = await authService.getProfile(authReq.user!.userId);
    res.json(user);
  } catch (error: any) {
    res.status(404).json({ error: error.message });
  }
});

export default router;
