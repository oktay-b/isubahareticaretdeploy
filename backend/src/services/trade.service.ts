import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

export class TradeService {
  /**
   * Execute a BUY trade: convert fromCurrency to toCurrency at current rate
   * e.g. BUY USD with TRY: fromCurrency=TRY, toCurrency=USD, amount=1000(TRY)
   * Result: deduct 1000 TRY, add (1000/rate) USD
   */
  async buy(userId: string, fromCurrency: string, toCurrency: string, amount: number) {
    // Get current rate for the pair
    const rate = await this.getRate(fromCurrency, toCurrency);
    const convertedAmount = amount / rate;

    return await prisma.$transaction(async (tx) => {
      // Check source wallet balance
      const sourceWallet = await tx.wallet.findUnique({
        where: { userId_currency: { userId, currency: fromCurrency } },
      });
      if (!sourceWallet) {
        throw new Error(`${fromCurrency} cüzdanı bulunamadı.`);
      }
      if (Number(sourceWallet.balance) < amount) {
        throw new Error(`Yetersiz ${fromCurrency} bakiyesi. Mevcut: ${sourceWallet.balance}`);
      }

      // Ensure target wallet exists
      let targetWallet = await tx.wallet.findUnique({
        where: { userId_currency: { userId, currency: toCurrency } },
      });
      if (!targetWallet) {
        targetWallet = await tx.wallet.create({
          data: { userId, currency: toCurrency, balance: 0 },
        });
      }

      // Deduct from source
      await tx.wallet.update({
        where: { id: sourceWallet.id },
        data: { balance: { decrement: amount } },
      });

      // Add to target
      await tx.wallet.update({
        where: { id: targetWallet.id },
        data: { balance: { increment: convertedAmount } },
      });

      // Record transaction
      const transaction = await tx.transaction.create({
        data: {
          userId,
          type: 'BUY',
          fromCurrency,
          toCurrency,
          amount: new Prisma.Decimal(amount),
          rate: new Prisma.Decimal(rate),
          total: new Prisma.Decimal(convertedAmount),
        },
      });

      return {
        id: transaction.id,
        type: 'BUY',
        fromCurrency,
        toCurrency,
        amount: Number(transaction.amount),
        rate: Number(transaction.rate),
        total: Number(transaction.total),
        createdAt: transaction.createdAt,
      };
    });
  }

  /**
   * Execute a SELL trade: convert toCurrency back to fromCurrency
   * e.g. SELL USD for TRY: fromCurrency=USD, toCurrency=TRY, amount=100(USD)
   * Result: deduct 100 USD, add (100*rate) TRY
   */
  async sell(userId: string, fromCurrency: string, toCurrency: string, amount: number) {
    const rate = await this.getRate(fromCurrency, toCurrency);
    const convertedAmount = amount * rate;

    return await prisma.$transaction(async (tx) => {
      // Check source wallet
      const sourceWallet = await tx.wallet.findUnique({
        where: { userId_currency: { userId, currency: fromCurrency } },
      });
      if (!sourceWallet) {
        throw new Error(`${fromCurrency} cüzdanı bulunamadı.`);
      }
      if (Number(sourceWallet.balance) < amount) {
        throw new Error(`Yetersiz ${fromCurrency} bakiyesi. Mevcut: ${sourceWallet.balance}`);
      }

      // Ensure target wallet
      let targetWallet = await tx.wallet.findUnique({
        where: { userId_currency: { userId, currency: toCurrency } },
      });
      if (!targetWallet) {
        targetWallet = await tx.wallet.create({
          data: { userId, currency: toCurrency, balance: 0 },
        });
      }

      // Deduct from source
      await tx.wallet.update({
        where: { id: sourceWallet.id },
        data: { balance: { decrement: amount } },
      });

      // Add to target
      await tx.wallet.update({
        where: { id: targetWallet.id },
        data: { balance: { increment: convertedAmount } },
      });

      // Record transaction
      const transaction = await tx.transaction.create({
        data: {
          userId,
          type: 'SELL',
          fromCurrency,
          toCurrency,
          amount: new Prisma.Decimal(amount),
          rate: new Prisma.Decimal(rate),
          total: new Prisma.Decimal(convertedAmount),
        },
      });

      return {
        id: transaction.id,
        type: 'SELL',
        fromCurrency,
        toCurrency,
        amount: Number(transaction.amount),
        rate: Number(transaction.rate),
        total: Number(transaction.total),
        createdAt: transaction.createdAt,
      };
    });
  }

  /**
   * Get transaction history for a user
   */
  async getHistory(userId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;
    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.transaction.count({ where: { userId } }),
    ]);

    return {
      transactions: transactions.map((t) => ({
        id: t.id,
        type: t.type,
        fromCurrency: t.fromCurrency,
        toCurrency: t.toCurrency,
        amount: Number(t.amount),
        rate: Number(t.rate),
        total: Number(t.total),
        createdAt: t.createdAt,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get the exchange rate between two currencies.
   * Looks up the rate from the ExchangeRates table.
   */
  private async getRate(from: string, to: string): Promise<number> {
    // Try direct pair
    const directPair = `${from}/${to}`;
    const directRate = await prisma.exchangeRate.findUnique({
      where: { currency: directPair },
    });
    if (directRate) {
      return Number(directRate.rate);
    }

    // Try reverse pair
    const reversePair = `${to}/${from}`;
    const reverseRate = await prisma.exchangeRate.findUnique({
      where: { currency: reversePair },
    });
    if (reverseRate) {
      return 1 / Number(reverseRate.rate);
    }

    // Try to calculate via TRY
    if (from !== 'TRY' && to !== 'TRY') {
      const fromToTry = await prisma.exchangeRate.findUnique({
        where: { currency: `${from}/TRY` },
      });
      const toToTry = await prisma.exchangeRate.findUnique({
        where: { currency: `${to}/TRY` },
      });
      if (fromToTry && toToTry) {
        return Number(fromToTry.rate) / Number(toToTry.rate);
      }
    }

    throw new Error(`${from}/${to} kuru bulunamadı.`);
  }
}

export const tradeService = new TradeService();
