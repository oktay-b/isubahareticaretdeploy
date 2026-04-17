# İSÜ Bahar — Yatırım Simülatörü

Gerçek zamanlı altın, döviz ve kripto para takip ve alım-satım platformu. Canlı fiyatlarla simüle edilmiş yatırım işlemleri yapın, portföyünüzü takip edin, kar/zarar durumunuzu görün.

## Özellikler

- Gram/çeyrek/yarım/tam/Cumhuriyet altını ve gram gümüş takibi
- USD, EUR, GBP döviz alım-satım
- Bitcoin ve Ethereum (simüle) alım-satım
- Ortalama maliyet hesaplı portföy takibi
- Anlık kar/zarar yüzdesi gösterimi
- WebSocket ile canlı fiyat güncellemesi (10 saniyede bir)
- İşlem geçmişi ve filtreleme
- Admin paneli (varlık ve kullanıcı yönetimi)
- JWT kimlik doğrulama, Zod validasyon

## Kurulum

### Gereksinimler
- Node.js 18+

### Backend

```bash
cd backend
npm install
cp .env.example .env   # .env dosyasını düzenleyin

npx prisma db push
npx prisma generate
npm run seed            # varlıkları ve admin kullanıcıyı yükler
npm run dev
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Kullanım

1. `http://localhost:3000` adresini açın
2. Yeni hesap oluşturun (100.000 ₺ demo bakiye ile başlarsınız)
3. Dashboard'dan canlı fiyatları takip edin
4. Al/Sat sayfasından altın, döviz veya kripto alım-satım yapın
5. Portföy sayfasından kar/zarar durumunuzu izleyin

Admin girişi: `admin@isu.edu.tr` / `admin123`

## Mimari

```
Frontend (Next.js + Tailwind)  →  Backend (Express + Socket.io)  →  SQLite (Prisma ORM)
                                          ↓
                              Simüle fiyat servisi (10sn aralıklı)
```

## API

| Method | Endpoint | Açıklama |
|--------|----------|----------|
| POST | `/api/auth/register` | Kayıt |
| POST | `/api/auth/login` | Giriş |
| GET | `/api/auth/me` | Profil |
| GET | `/api/portfolio` | Portföy (bakiye + varlıklar + kar/zarar) |
| POST | `/api/trade/buy` | Varlık al |
| POST | `/api/trade/sell` | Varlık sat |
| GET | `/api/trade/history` | İşlem geçmişi |
| GET | `/api/rates` | Güncel fiyatlar |
| GET | `/api/rates/assets` | Varlık listesi |
| GET | `/api/admin/stats` | Admin istatistikleri |
| GET | `/api/admin/users` | Kullanıcı listesi |
| GET | `/api/admin/assets` | Varlık yönetimi |

## WebSocket

| Event | Yön | Açıklama |
|-------|-----|----------|
| `prices:update` | Server → Client | Güncel fiyatlar |
| `prices:history` | Server → Client | Fiyat geçmişi (grafik) |

## Teknolojiler

| Katman | Teknoloji |
|--------|-----------|
| Frontend | Next.js, Tailwind CSS, Zustand, Recharts |
| Backend | Node.js, Express, Socket.io, TypeScript |
| Veritabanı | SQLite, Prisma ORM |
| Kimlik Doğrulama | JWT, bcrypt |
| Validasyon | Zod |
