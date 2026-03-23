'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated, getUser } from '@/lib/auth';
import { useStore } from '@/store/useStore';
import { walletApi } from '@/lib/api';
import { getSocket } from '@/lib/socket';
import Navbar from '@/components/Navbar';
import WalletCard from '@/components/WalletCard';

export default function WalletPage() {
  const router = useRouter();
  const { setAuth, rates, setRates, wallets, setWallets } = useStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }

    const savedUser = getUser();
    const token = localStorage.getItem('token');
    if (savedUser && token) {
      setAuth(savedUser, token);
    }

    walletApi.getWallets().then((res) => setWallets(res.data)).catch(console.error);

    const socket = getSocket();
    socket.on('rates:update', (data: { rates: Record<string, number> }) => {
      setRates(data.rates);
    });

    return () => { socket.off('rates:update'); };
  }, []);

  if (!mounted) return null;

  // Calculate total portfolio value in TRY
  const totalTRY = wallets.reduce((acc, w) => {
    if (w.currency === 'TRY') return acc + w.balance;
    const pair = `${w.currency}/TRY`;
    const rate = rates[pair];
    if (rate) return acc + w.balance * rate;
    return acc + w.balance;
  }, 0);

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0c0f1a, #111827)' }}>
      <Navbar />
      <main style={{ maxWidth: '1000px', margin: '0 auto', padding: '24px' }}>
        <div className="slide-up" style={{ marginBottom: '32px' }}>
          <h1 style={{
            fontSize: '28px',
            fontWeight: 800,
            color: 'var(--color-text-primary)',
            marginBottom: '8px',
          }}>
            💰 Cüzdanım
          </h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '14px' }}>
            Tüm döviz bakiyeleriniz
          </p>
        </div>

        {/* Total value card */}
        <div className="glass-card glow-primary slide-up" style={{
          padding: '32px',
          marginBottom: '28px',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '14px', color: 'var(--color-text-muted)', marginBottom: '8px' }}>
            📊 Toplam Portföy Değeri (₺)
          </div>
          <div style={{
            fontSize: '42px',
            fontWeight: 800,
            background: 'linear-gradient(135deg, var(--color-success), var(--color-accent))',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            {new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2 }).format(totalTRY)} ₺
          </div>
          <div style={{
            fontSize: '12px',
            color: 'var(--color-text-muted)',
            marginTop: '8px',
          }}>
            {wallets.length} farklı döviz cüzdanı
          </div>
        </div>

        {/* Wallet cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '16px',
        }}>
          {wallets.map((w) => (
            <WalletCard key={w.id} currency={w.currency} balance={w.balance} />
          ))}
        </div>
      </main>
    </div>
  );
}
