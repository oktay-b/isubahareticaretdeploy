import prisma from '../lib/prisma.js';

export class AdminService {
  async getUsers(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        select: { id: true, name: true, email: true, role: true, balance: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.user.count(),
    ]);

    return {
      users: users.map((u) => ({ ...u, balance: Number(u.balance) })),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async getAssets() {
    const assets = await prisma.asset.findMany({
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
    });
    return assets;
  }

  async updateAsset(id, data) {
    return prisma.asset.update({ where: { id }, data });
  }

  async createAsset(data) {
    return prisma.asset.create({ data });
  }

  async getStats() {
    const [userCount, orderCount, assetCount] = await Promise.all([
      prisma.user.count(),
      prisma.order.count(),
      prisma.asset.count({ where: { active: true } }),
    ]);

    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentOrders = await prisma.order.findMany({
      where: { createdAt: { gte: dayAgo } },
      select: { total: true },
    });
    const dailyVolume = recentOrders.reduce((sum, o) => sum + Number(o.total), 0);

    return {
      userCount,
      orderCount,
      assetCount,
      dailyVolume: parseFloat(dailyVolume.toFixed(2)),
    };
  }
}

export const adminService = new AdminService();
