'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated, getUser } from '@/lib/auth';
import { useStore } from '@/store/useStore';
import { walletApi } from '@/lib/api';
import { getSocket } from '@/lib/socket';
import Navbar from '@/components/Navbar';
import RateCard from '@/components/RateCard';
import RateChart from '@/components/RateChart';
import TradeForm from '@/components/TradeForm';
import WalletCard from '@/components/WalletCard';

export default function DashboardPage() {
  const router = useRouter();
  const { user, setAuth, rates, setRates, wallets, setWallets, addRateHistory, setRateHistory } = useStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }

    // Restore user from localStorage
    const savedUser = getUser();
    const token = localStorage.getItem('token');
    if (savedUser && token) {
      setAuth(savedUser, token);
    }

    // Fetch wallets
    walletApi.getWallets().then((res) => {
      setWallets(res.data);
    }).catch(console.error);

    // Connect to WebSocket
    const socket = getSocket();

    socket.on('rates:update', (data: { rates: Record<string, number>; timestamp: number }) => {
      setRates(data.rates);
      addRateHistory(data);
    });

    socket.on('rates:history', (history: Array<{ timestamp: number; rates: Record<string, number> }>) => {
      setRateHistory(history);
    });

    return () => {
      socket.off('rates:update');
      socket.off('rates:history');
    };
  }, []);

  if (!mounted) return null;

  const pairs = Object.keys(rates);

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
      <main style={{ maxWidth: '1400px', margin: '0 auto', padding: '24px' }}>
        {/* Welcome Header */}
        <div className="slide-up" style={{ marginBottom: '32px' }}>
          <h1 style={{
            fontSize: '28px',
            fontWeight: 800,
            color: 'var(--color-text-primary)',
            marginBottom: '8px',
          }}>
            Hoş Geldin, {user?.name || 'Trader'} 👋
          </h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '14px' }}>
            Portföy değeriniz:{' '}
            <span style={{
              color: 'var(--color-success)',
              fontWeight: 700,
              fontSize: '16px',
            }}>
              {new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2 }).format(totalTRY)} ₺
            </span>
          </p>
        </div>

        {/* Rate Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '16px',
          marginBottom: '24px',
        }}>
          {pairs.map((pair) => (
            <RateCard key={pair} pair={pair} rate={rates[pair]} />
          ))}
        </div>

        {/* Chart + Trade Form */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 380px',
          gap: '24px',
          marginBottom: '24px',
        }}>
          <RateChart />
          <TradeForm />
        </div>

        {/* Wallet Summary */}
        <div style={{ marginBottom: '24px' }}>
          <h2 style={{
            fontSize: '18px',
            fontWeight: 700,
            color: 'var(--color-text-primary)',
            marginBottom: '16px',
          }}>
            💰 Cüzdanlarım
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
            gap: '16px',
          }}>
            {wallets.map((w) => (
              <WalletCard key={w.id} currency={w.currency} balance={w.balance} />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
