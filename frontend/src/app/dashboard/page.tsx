'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated, getUser } from '@/lib/auth';
import { useStore } from '@/store/useStore';
import { walletApi } from '@/lib/api';
import { getSocket } from '@/lib/socket';
import Navbar from '@/components/Navbar';
import RateCard, { HIDDEN_PAIRS } from '@/components/RateCard';
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

  // Gizli alt tipler filtrele (Çeyrek, Yarım, Tam, Cumhuriyet Altını)
  const pairs = Object.keys(rates).filter((p) => !HIDDEN_PAIRS.has(p));

  // Calculate total portfolio value in TRY
  const totalTRY = wallets.reduce((acc, w) => {
    if (w.currency === 'TRY') return acc + w.balance;
    const pair = `${w.currency}/TRY`;
    const rate = rates[pair];
    if (rate) return acc + w.balance * rate;
    return acc + w.balance;
  }, 0);

  return (
    <div style={{ minHeight: '100vh', background: '#FFFFFF' }}>
      <Navbar />
      <main style={{ maxWidth: '1400px', margin: '0 auto', padding: '20px 24px' }}>

        {/* Üst bar */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: '20px', paddingBottom: '16px',
          borderBottom: '1px solid var(--color-border)',
        }}>
          <div>
            <div style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>
              {user?.name || 'Trader'}
            </div>
            <div style={{
              fontSize: '22px', fontWeight: 700,
              fontFamily: "'JetBrains Mono', monospace",
              color: 'var(--color-text-primary)',
              letterSpacing: '-0.5px',
            }}>
              {new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2 }).format(totalTRY)}
              <span style={{ fontSize: '14px', fontWeight: 400, color: 'var(--color-text-muted)', marginLeft: '4px' }}>₺</span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div className="pulse-live" style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#0ECB81' }} />
            <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Piyasa Açık</span>
          </div>
        </div>

        {/* Fiyat kartları — ticker grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
          gap: '10px',
          marginBottom: '20px',
        }}>
          {pairs.map((pair) => (
            <RateCard key={pair} pair={pair} rate={rates[pair]} />
          ))}
        </div>

        {/* Grafik + İşlem formu */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 360px',
          gap: '20px',
          marginBottom: '20px',
        }}>
          <RateChart />
          <TradeForm />
        </div>

        {/* Cüzdanlar */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{
            fontSize: '13px', fontWeight: 600, color: 'var(--color-text-muted)',
            textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px',
          }}>
            Varlıklarım
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: '10px',
          }}>
            {wallets.map((w) => (
              <WalletCard key={w.currency} currency={w.currency} balance={w.balance} />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
