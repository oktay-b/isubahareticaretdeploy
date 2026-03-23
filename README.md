# 💹 Real-Time Currency Trading Platform

Gerçek zamanlı döviz alım-satım platformu. Canlı kurlarla USD, EUR, GBP ve TRY arasında simüle edilmiş işlemler yapın.

## 🚀 Hızlı Başlangıç

### Gereksinimler
- Node.js 18+
- PostgreSQL (çalışır durumda)

### 1. Backend Kurulumu

```bash
cd backend
npm install

# .env dosyasını düzenleyin (DATABASE_URL, JWT_SECRET, vb.)
# PostgreSQL bağlantınızı ayarlayın

# Veritabanı tablolarını oluşturun
npx prisma db push
npx prisma generate

# Sunucuyu başlatın
npm run dev
```

### 2. Frontend Kurulumu

```bash
cd frontend
npm install
npm run dev
```

### 3. Kullanım

1. `http://localhost:3000` adresini açın
2. Yeni hesap oluşturun (100.000₺ demo bakiye ile başlarsınız)
3. Dashboard'dan canlı kurları takip edin
4. Al/Sat sayfasından döviz alım-satım işlemleri yapın

## 🏗️ Mimari

```
Frontend (Next.js + TailwindCSS)  →  Backend API (Express + Socket.io)  →  PostgreSQL (Prisma ORM)
                                                    ↓
                                        ExchangeRate-API (döviz kurları)
```

## 📡 API Endpoints

| Method | Endpoint | Açıklama |
|--------|----------|----------|
| POST | `/api/auth/register` | Yeni kullanıcı kaydı |
| POST | `/api/auth/login` | Giriş |
| GET | `/api/auth/me` | Kullanıcı profili |
| GET | `/api/wallets` | Cüzdanları listele |
| POST | `/api/trade/buy` | Döviz al |
| POST | `/api/trade/sell` | Döviz sat |
| GET | `/api/trade/history` | İşlem geçmişi |
| GET | `/api/rates` | Güncel kurlar |

## 🔌 WebSocket Events

| Event | Yön | Açıklama |
|-------|-----|----------|
| `rates:update` | Server → Client | Güncel kur verileri |
| `rates:history` | Server → Client | Kur geçmişi (grafik) |

## 🛡️ Güvenlik

- JWT Authentication
- bcrypt ile şifre hashleme
- Zod ile input validasyonu
- CORS koruması
- Prisma transaction ile veri bütünlüğü

## ⚙️ Teknoloji Stack

| Katman | Teknoloji |
|--------|-----------|
| Frontend | Next.js, TailwindCSS, Zustand, Recharts |
| Backend | Node.js, Express, Socket.io, TypeScript |
| Database | PostgreSQL, Prisma ORM |
| Auth | JWT, bcrypt |
