import { Prisma } from '@prisma/client';
import prisma from '../lib/prisma';
import { priceService } from './rates.service';

export class TradeService {
  /**
   * varlık satın al — TRY bakiyeden düşer, holding güncellenir
   * ortalama maliyet: (eski toplam + yeni toplam) / (eski miktar + yeni miktar)
   */
  async buy(userId: string, assetSymbol: string, quantity: number) {
    const asset = await prisma.asset.findUnique({ where: { symbol: assetSymbol } });
    if (!asset) throw new Error(`${assetSymbol} bulunamadı.`);
    if (!asset.active) throw new Error(`${asset.name} şu an işleme kapalı.`);

    const price = await priceService.getAssetPrice(assetSymbol);
    const unitPrice = price.buy; // alış fiyatı
    const totalCost = quantity * unitPrice;

    return await prisma.$transaction(async (tx) => {
      // bakiye kontrolü
      const user = await tx.user.findUnique({ where: { id: userId } });
      if (!user) throw new Error('Kullanıcı bulunamadı.');

      const currentBalance = Number(user.balance);
      if (currentBalance < totalCost) {
        throw new Error(
          `Yetersiz bakiye. Gereken: ${totalCost.toFixed(2)} ₺, Mevcut: ${currentBalance.toFixed(2)} ₺`
        );
      }

      // bakiye düş
      await tx.user.update({
        where: { id: userId },
        data: { balance: { decrement: totalCost } },
      });

      // holding güncelle — varsa ortalama maliyeti hesapla
      const existing = await tx.holding.findUnique({
        where: { userId_assetId: { userId, assetId: asset.id } },
      });

      if (existing) {
        const oldQty = Number(existing.quantity);
        const oldAvg = Number(existing.avgCost);
        const newQty = oldQty + quantity;
        // ağırlıklı ortalama maliyet
        const newAvg = (oldQty * oldAvg + quantity * unitPrice) / newQty;

        await tx.holding.update({
          where: { id: existing.id },
          data: {
            quantity: new Prisma.Decimal(newQty),
            avgCost: new Prisma.Decimal(parseFloat(newAvg.toFixed(4))),
          },
        });
      } else {
        await tx.holding.create({
          data: {
            userId,
            assetId: asset.id,
            quantity,
            avgCost: unitPrice,
          },
        });
      }

      // sipariş kaydı
      const order = await tx.order.create({
        data: {
          userId,
          assetId: asset.id,
          type: 'BUY',
          quantity,
          price: unitPrice,
          total: totalCost,
          pnl: 0,
          pnlPct: 0,
        },
      });

      return {
        id: order.id,
        type: 'BUY',
        asset: { symbol: asset.symbol, name: asset.name },
        quantity,
        price: unitPrice,
        total: totalCost,
        createdAt: order.createdAt,
      };
    });
  }

  /**
   * varlık sat — holding'den düşer, TRY bakiyeye eklenir
   * kar/zarar: (satış fiyatı - ortalama maliyet) * miktar
   */
  async sell(userId: string, assetSymbol: string, quantity: number) {
    const asset = await prisma.asset.findUnique({ where: { symbol: assetSymbol } });
    if (!asset) throw new Error(`${assetSymbol} bulunamadı.`);
    if (!asset.active) throw new Error(`${asset.name} şu an işleme kapalı.`);

    const price = await priceService.getAssetPrice(assetSymbol);
    const unitPrice = price.sell; // satış fiyatı
    const totalRevenue = quantity * unitPrice;

    return await prisma.$transaction(async (tx) => {
      // holding kontrolü
      const holding = await tx.holding.findUnique({
        where: { userId_assetId: { userId, assetId: asset.id } },
      });

      if (!holding || Number(holding.quantity) < quantity) {
        const mevcut = holding ? Number(holding.quantity) : 0;
        throw new Error(
          `Yetersiz ${asset.name} miktarı. Satmak istediğiniz: ${quantity}, Elinizde: ${mevcut}`
        );
      }

      const avgCost = Number(holding.avgCost);
      const pnl = (unitPrice - avgCost) * quantity;
      const pnlPct = avgCost > 0 ? ((unitPrice - avgCost) / avgCost) * 100 : 0;

      // holding güncelle
      const newQty = Number(holding.quantity) - quantity;
      if (newQty <= 0.0001) {
        // neredeyse sıfır kaldıysa sil
        await tx.holding.delete({ where: { id: holding.id } });
      } else {
        await tx.holding.update({
          where: { id: holding.id },
          data: { quantity: new Prisma.Decimal(newQty) },
          // avgCost değişmez, sadece miktar azalır
        });
      }

      // bakiye ekle
      await tx.user.update({
        where: { id: userId },
        data: { balance: { increment: totalRevenue } },
      });

      // sipariş kaydı
      const order = await tx.order.create({
        data: {
          userId,
          assetId: asset.id,
          type: 'SELL',
          quantity,
          price: unitPrice,
          total: totalRevenue,
          pnl: parseFloat(pnl.toFixed(2)),
          pnlPct: parseFloat(pnlPct.toFixed(2)),
        },
      });

      return {
        id: order.id,
        type: 'SELL',
        asset: { symbol: asset.symbol, name: asset.name },
        quantity,
        price: unitPrice,
        total: totalRevenue,
        pnl: parseFloat(pnl.toFixed(2)),
        pnlPct: parseFloat(pnlPct.toFixed(2)),
        createdAt: order.createdAt,
      };
    });
  }

  // işlem geçmişi — sayfalı
  async getHistory(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where: { userId },
        include: { asset: { select: { symbol: true, name: true, category: true } } },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.order.count({ where: { userId } }),
    ]);

    return {
      orders: orders.map((o) => ({
        id: o.id,
        type: o.type,
        asset: o.asset,
        quantity: Number(o.quantity),
        price: Number(o.price),
        total: Number(o.total),
        pnl: Number(o.pnl),
        pnlPct: Number(o.pnlPct),
        createdAt: o.createdAt,
      })),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }
}

export const tradeService = new TradeService();
