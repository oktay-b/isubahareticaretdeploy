import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { config } from '../config';

const prisma = new PrismaClient();

export class AuthService {
  /**
   * Register a new user with hashed password and default wallets
   */
  async register(name: string, email: string, password: string) {
    // Check if email already exists
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new Error('Bu e-posta adresi zaten kayıtlı.');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user with default wallets in a transaction
    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
        },
      });

      // Create wallets for each default currency
      const walletPromises = config.defaultCurrencies.map((currency) =>
        tx.wallet.create({
          data: {
            userId: newUser.id,
            currency,
            balance: currency === 'TRY' ? config.startingBalance : 0,
          },
        })
      );
      await Promise.all(walletPromises);

      return newUser;
    });

    // Generate JWT
    const token = this.generateToken(user.id, user.email);

    return {
      user: { id: user.id, name: user.name, email: user.email },
      token,
    };
  }

  /**
   * Login with email and password
   */
  async login(email: string, password: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new Error('E-posta veya şifre hatalı.');
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      throw new Error('E-posta veya şifre hatalı.');
    }

    const token = this.generateToken(user.id, user.email);

    return {
      user: { id: user.id, name: user.name, email: user.email },
      token,
    };
  }

  /**
   * Get user profile by ID
   */
  async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, createdAt: true },
    });
    if (!user) {
      throw new Error('Kullanıcı bulunamadı.');
    }
    return user;
  }

  private generateToken(userId: string, email: string): string {
    return jwt.sign({ userId, email }, config.jwtSecret, { expiresIn: '7d' });
  }
}

export const authService = new AuthService();
