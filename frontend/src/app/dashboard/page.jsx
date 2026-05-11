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
import WalletCard from '@/components/WalletCard';
import { EyeIcon, EyeOffIcon } from '@/components/AssetIcons';

export default function DashboardPage() {
  const router = useRouter();
  const {
    user, setAuth, rates, setRates, wallets, setWallets,
    addRateHistory, setRateHistory,
    balanceVisible, toggleBalanceVisible,
  } = useStore();
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

    walletApi.getWallets().then((res) => {
      setWallets(res.data);
    }).catch(console.error);

    const socket = getSocket();

    socket.on('rates:update', (data) => {
      setRates(data.rates);
      addRateHistory(data);
    });

    socket.on('rates:history', (history) => {
      setRateHistory(history);
    });

    return () => {
      socket.off('rates:update');
      socket.off('rates:history');
    };
  }, []);

  if (!mounted) return null;

  const pairs = Object.keys(rates).filter((p) => !HIDDEN_PAIRS.has(p));

  const totalTRY = wallets.reduce((acc, w) => {
    if (w.currency === 'TRY') return acc + w.balance;
    const pair = `${w.currency}/TRY`;
    const rate = rates[pair];
    if (rate) return acc + w.balance * rate;
    return acc + w.balance;
  }, 0);

  const formattedTotal = new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2 }).format(totalTRY);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-surface)' }}>
      <Navbar />
      <main style={{ maxWidth: '1400px', margin: '0 auto', padding: '20px 24px' }}>

        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: '20px', paddingBottom: '16px',
          borderBottom: '1px solid var(--color-border)',
        }}>
          <div>
            <div style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>
              {user?.name || 'Trader'}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                fontSize: '22px', fontWeight: 700,
                fontFamily: "'JetBrains Mono', monospace",
                color: 'var(--color-text-primary)',
                letterSpacing: '-0.5px',
                transition: 'filter 0.2s',
                filter: balanceVisible ? 'none' : 'blur(8px)',
                userSelect: balanceVisible ? 'auto' : 'none',
              }}>
                {formattedTotal}
                <span style={{ fontSize: '14px', fontWeight: 400, color: 'var(--color-text-muted)', marginLeft: '4px' }}>₺</span>
              </div>
              <button
                onClick={toggleBalanceVisible}
                title={balanceVisible ? 'Bakiyeleri Gizle' : 'Bakiyeleri Göster'}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  width: '28px', height: '28px', borderRadius: '6px',
                  background: 'transparent',
                  border: '1px solid var(--color-border)',
                  color: 'var(--color-text-muted)',
                  cursor: 'pointer', transition: 'all 0.2s', flexShrink: 0,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'var(--color-surface-light)';
                  e.currentTarget.style.color = 'var(--color-text-primary)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = 'var(--color-text-muted)';
                }}
              >
                {balanceVisible
                  ? <EyeIcon size={14} />
                  : <EyeOffIcon size={14} />}
              </button>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div className="pulse-live" style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#0ECB81' }} />
            <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Piyasa Açık</span>
          </div>
        </div>

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

        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr',
          gap: '20px',
          marginBottom: '20px',
        }}>
          <RateChart />
        </div>

        <div style={{ marginBottom: '24px' }}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            marginBottom: '12px',
          }}>
            <div style={{
              fontSize: '13px', fontWeight: 600, color: 'var(--color-text-muted)',
              textTransform: 'uppercase', letterSpacing: '0.5px',
            }}>
              Varlıklarım
            </div>
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
