import prisma from '../lib/prisma.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { config } from '../config.js';

export class AuthService {
  async register(name, email, password) {
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

  async login(email, password) {
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

  async getProfile(userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, role: true, balance: true, createdAt: true },
    });
    if (!user) {
      throw new Error('Kullanıcı bulunamadı.');
    }
    return { ...user, balance: Number(user.balance) };
  }

  async updateProfile(userId, data) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error('Kullanıcı bulunamadı.');

    const updateData = {};

    if (data.name && data.name.trim().length > 0) {
      updateData.name = data.name.trim();
    }

    if (data.newPassword) {
      if (!data.currentPassword) {
        throw new Error('Şifre değiştirmek için mevcut şifrenizi girmelisiniz.');
      }
      const valid = await bcrypt.compare(data.currentPassword, user.password);
      if (!valid) {
        throw new Error('Mevcut şifreniz yanlış.');
      }
      updateData.password = await bcrypt.hash(data.newPassword, 12);
    }

    if (Object.keys(updateData).length > 0) {
      await prisma.user.update({
        where: { id: userId },
        data: updateData
      });
    }

    return this.getProfile(userId);
  }

  generateToken(userId, email, role) {
    return jwt.sign({ userId, email, role }, config.jwtSecret, { expiresIn: '7d' });
  }
}

export const authService = new AuthService();
