import prisma from '../lib/prisma';
import { config } from '../config';

async function seed() {
  console.log('Veritabanı seed başlatılıyor...');

  for (const assetDef of config.assets) {
    const asset = await prisma.asset.upsert({
      where: { symbol: assetDef.symbol },
      update: { name: assetDef.name, category: assetDef.category, unit: assetDef.unit },
      create: {
        symbol: assetDef.symbol,
        name: assetDef.name,
        category: assetDef.category,
        unit: assetDef.unit,
      },
    });

    // başlangıç fiyat kaydı
    const spread = assetDef.basePrice * config.spreadRate;
    await prisma.price.create({
      data: {
        assetId: asset.id,
        buyPrice: assetDef.basePrice + spread,
        sellPrice: assetDef.basePrice - spread,
      },
    });

    console.log(`  ✓ ${assetDef.name} (${assetDef.symbol}) — ${assetDef.basePrice} TRY`);
  }

  // admin kullanıcı oluştur (yoksa)
  const bcrypt = await import('bcrypt');
  const adminPass = await bcrypt.hash('admin123', 12);

  await prisma.user.upsert({
    where: { email: 'admin@isu.edu.tr' },
    update: {},
    create: {
      name: 'Admin',
      email: 'admin@isu.edu.tr',
      password: adminPass,
      role: 'ADMIN',
      balance: 0,
    },
  });
  console.log('  ✓ Admin kullanıcı oluşturuldu (admin@isu.edu.tr / admin123)');

  console.log('\nSeed tamamlandı!');
}

seed()
  .catch((e) => {
    console.error('Seed hatası:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
