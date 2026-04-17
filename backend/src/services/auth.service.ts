import prisma from '../lib/prisma';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { config } from '../config';

export class AuthService {
  async register(name: string, email: string, password: string) {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new Error('Bu e-posta adresi zaten kayıtlı.');
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: 'USER',
        balance: config.startingBalance,
      },
    });

    const token = this.generateToken(user.id, user.email, user.role);

    return {
      user: { id: user.id, name: user.name, email: user.email, role: user.role, balance: Number(user.balance) },
      token,
    };
  }

  async login(email: string, password: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new Error('E-posta veya şifre hatalı.');
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      throw new Error('E-posta veya şifre hatalı.');
    }

    const token = this.generateToken(user.id, user.email, user.role);

    return {
      user: { id: user.id, name: user.name, email: user.email, role: user.role, balance: Number(user.balance) },
      token,
    };
  }

  async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, role: true, balance: true, createdAt: true },
    });
    if (!user) {
      throw new Error('Kullanıcı bulunamadı.');
    }
    return { ...user, balance: Number(user.balance) };
  }

  private generateToken(userId: string, email: string, role: string): string {
    return jwt.sign({ userId, email, role }, config.jwtSecret, { expiresIn: '7d' });
  }
}

export const authService = new AuthService();
