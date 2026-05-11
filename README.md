# İSÜ Bahar — Yatırım Simülatörü

Gerçek zamanlı döviz, altın ve kripto takip & alım-satım platformu. Kullanıcılar 100.000 ₺ demo bakiyeyle başlayarak canlı fiyatlar üzerinden işlem yapabilir, portföylerini takip edebilir ve kar/zarar durumlarını görebilir.

## Özellikler

- USD, EUR, GBP döviz alım-satım
- Gram altın, gram gümüş takibi ve işlem
- Bitcoin ve Ethereum alım-satım
- Ortalama maliyet hesaplı portföy takibi
- Anlık kar/zarar yüzdesi gösterimi
- WebSocket ile canlı fiyat güncellemesi (10 saniyede bir)
- İşlem geçmişi
- Admin paneli (kullanıcı ve varlık yönetimi)
- JWT kimlik doğrulama
- Light / Dark tema

## Kurulum

### Gereksinimler

- Node.js 18+

### Backend

```bash
cd backend
npm install
cp .env.example .env
# .env dosyasını açıp JWT_SECRET değerini düzenleyin

npx prisma db push
npx prisma generate
npm run seed
npm run dev
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Tarayıcıda `http://localhost:3000` adresini açın.

### İlk Kullanım

1. Kayıt ol sayfasından yeni hesap oluşturun — 100.000 ₺ bakiye ile başlarsınız
2. Dashboard'dan canlı fiyatları ve portföy durumunu takip edin
3. Al/Sat sayfasından işlem yapın
4. Geçmiş sayfasından tüm işlemlerinizi görün

Admin girişi: `admin@isu.edu.tr` / `admin123`

## Proje Yapısı

```
├── backend/
│   ├── prisma/
│   │   └── schema.prisma        # Veritabanı şeması
│   └── src/
│       ├── index.js             # Sunucu giriş noktası
│       ├── config.js            # Uygulama sabitleri
│       ├── middleware/
│       │   ├── auth.js          # JWT doğrulama
│       │   └── validate.js      # İstek validasyonu
│       ├── routes/
│       │   ├── auth.js          # Kimlik doğrulama endpoint'leri
│       │   ├── rates.js         # Fiyat endpoint'leri
│       │   ├── transaction.js   # Alım-satım endpoint'leri
│       │   ├── wallet.js        # Portföy endpoint'i
│       │   └── admin.js         # Admin endpoint'leri
│       ├── services/
│       │   ├── auth.service.js
│       │   ├── rates.service.js
│       │   ├── trade.service.js
│       │   ├── wallet.service.js
│       │   └── admin.service.js
│       └── socket/
│           └── index.js         # WebSocket (canlı fiyat yayını)
│
└── frontend/
    └── src/
        ├── app/
        │   ├── dashboard/       # Ana ekran
        │   ├── trade/           # Al/Sat ekranı
        │   ├── wallet/          # Cüzdan
        │   ├── history/         # İşlem geçmişi
        │   ├── profile/         # Profil
        │   ├── login/           # Giriş
        │   └── register/        # Kayıt
        ├── components/
        │   ├── Navbar.jsx
        │   ├── RateCard.jsx
        │   ├── RateChart.jsx
        │   ├── TradeForm.jsx
        │   ├── TransactionTable.jsx
        │   └── WalletCard.jsx
        ├── lib/
        │   ├── api.js           # HTTP istemcisi (Axios)
        │   ├── auth.js          # LocalStorage işlemleri
        │   └── socket.js        # WebSocket istemcisi
        └── store/
            └── useStore.js      # Global state (Zustand)
```

## API Endpoint'leri

| Method | Endpoint | Açıklama |
|--------|----------|----------|
| POST | `/api/auth/register` | Kayıt |
| POST | `/api/auth/login` | Giriş |
| GET | `/api/auth/me` | Profil bilgisi |
| PUT | `/api/auth/me` | Profil güncelle |
| GET | `/api/portfolio` | Portföy (bakiye + varlıklar + kar/zarar) |
| POST | `/api/trade/buy` | Varlık al |
| POST | `/api/trade/sell` | Varlık sat |
| GET | `/api/trade/history` | İşlem geçmişi |
| GET | `/api/rates` | Güncel fiyatlar |
| GET | `/api/rates/history` | Fiyat geçmişi |
| GET | `/api/rates/assets` | Varlık listesi |
| GET | `/api/admin/stats` | Platform istatistikleri |
| GET | `/api/admin/users` | Kullanıcı listesi |
| GET | `/api/admin/assets` | Varlık yönetimi |

## WebSocket

| Event | Yön | Açıklama |
|-------|-----|----------|
| `prices:update` | Sunucu → İstemci | 10 saniyede bir güncel fiyatlar |
| `prices:history` | Sunucu → İstemci | Grafik için fiyat geçmişi |

## Teknolojiler

| Katman | Teknoloji |
|--------|-----------|
| Frontend | Next.js, React, Tailwind CSS |
| State Yönetimi | Zustand |
| Grafik | Recharts |
| Backend | Node.js, Express.js |
| Gerçek Zamanlı | Socket.io |
| Veritabanı | SQLite, Prisma ORM |
| Kimlik Doğrulama | JWT, bcrypt |
| Validasyon | Zod |
| Dış Fiyat API | er-api.com, Swissquote, CoinGecko |
