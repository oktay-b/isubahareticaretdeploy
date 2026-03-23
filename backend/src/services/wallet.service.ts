import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class WalletService {
  /**
   * Get all wallets for a user
   */
  async getWallets(userId: string) {
    const wallets = await prisma.wallet.findMany({
      where: { userId },
      orderBy: { currency: 'asc' },
    });
    return wallets.map((w) => ({
      id: w.id,
      currency: w.currency,
      balance: Number(w.balance),
    }));
  }

  /**
   * Get a specific wallet for a user and currency
   */
  async getWallet(userId: string, currency: string) {
    const wallet = await prisma.wallet.findUnique({
      where: { userId_currency: { userId, currency } },
    });
    if (!wallet) {
      throw new Error(`${currency} cüzdanı bulunamadı.`);
    }
    return {
      id: wallet.id,
      currency: wallet.currency,
      balance: Number(wallet.balance),
    };
  }
}

export const walletService = new WalletService();
