'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated, getUser } from '@/lib/auth';
import { useStore } from '@/store/useStore';
import { walletApi } from '@/lib/api';
import { getSocket } from '@/lib/socket';
import Navbar from '@/components/Navbar';
import TradeForm from '@/components/TradeForm';
import RateCard, { HIDDEN_PAIRS } from '@/components/RateCard';

export default function TradePage() {
  const router = useRouter();
  const { setAuth, rates, setRates, setWallets, addRateHistory } = useStore();
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
    socket.on('rates:update', (data: { rates: Record<string, number>; timestamp: number }) => {
      setRates(data.rates);
      addRateHistory(data);
    });

    return () => { socket.off('rates:update'); };
  }, []);

  if (!mounted) return null;

  const pairs = Object.keys(rates).filter((p) => !HIDDEN_PAIRS.has(p));

  return (
    <div style={{ minHeight: '100vh', background: '#FFFFFF' }}>
      <Navbar />
      <main style={{ maxWidth: '1000px', margin: '0 auto', padding: '24px' }}>
        <div className="slide-up" style={{ marginBottom: '32px' }}>
          <h1 style={{
            fontSize: '28px',
            fontWeight: 800,
            color: 'var(--color-text-primary)',
            marginBottom: '8px',
          }}>
            💱 Alım-Satım
          </h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '14px' }}>
            Canlı kurlarla anında döviz alın veya satın
          </p>
        </div>

        {/* Rate Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
          gap: '12px',
          marginBottom: '24px',
        }}>
          {pairs.map((pair) => (
            <RateCard key={pair} pair={pair} rate={rates[pair]} />
          ))}
        </div>

        {/* Trade Form (full width) */}
        <TradeForm />
      </main>
    </div>
  );
}
