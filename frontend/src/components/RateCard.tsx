'use client';

import { useStore } from '@/store/useStore';

interface RateCardProps {
  pair: string;
  rate: number;
}

const assetMeta: Record<string, { icon: string; name: string; short: string; color: string }> = {
  'USD/TRY':        { icon: '🇺🇸', name: 'Amerikan Doları', short: 'USD',   color: '#2563eb' },
  'EUR/TRY':        { icon: '🇪🇺', name: 'Euro',              short: 'EUR',   color: '#7c3aed' },
  'GBP/TRY':        { icon: '🇬🇧', name: 'İngiliz Sterlini', short: 'GBP',   color: '#0891b2' },
  'GRAM_ALTIN/TRY': { icon: '🥇',  name: 'Altın',            short: 'XAU',   color: '#d97706' },
  'GRAM_GUMUS/TRY': { icon: '🥈',  name: 'Gümüş',            short: 'XAG',   color: '#64748b' },
  'BTC/TRY':        { icon: '₿',   name: 'Bitcoin',           short: 'BTC',   color: '#f59e0b' },
  'ETH/TRY':        { icon: 'Ξ',   name: 'Ethereum',          short: 'ETH',   color: '#6366f1' },
};

// Dashboard'da gizlenecek alt tipler
const HIDDEN_PAIRS = new Set([
  'CEYREK_ALTIN/TRY', 'YARIM_ALTIN/TRY', 'TAM_ALTIN/TRY', 'CUMHURIYET_ALTINI/TRY',
]);

export { HIDDEN_PAIRS };

function formatRate(rate: number, pair: string): string {
  if (pair.startsWith('BTC') || pair.startsWith('ETH')) {
    return new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(rate);
  }
  if (pair.startsWith('GRAM')) {
    return new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(rate);
  }
  return rate.toFixed(4);
}

export default function RateCard({ pair, rate }: RateCardProps) {
  const { previousRates, selectedAsset, setSelectedAsset } = useStore();
  const prevRate = previousRates[pair];
  const isActive = selectedAsset === pair;

  const meta = assetMeta[pair] || {
    icon: '📊',
    name: pair.split('/')[0],
    short: pair.split('/')[0],
    color: '#94a3b8',
  };

  let changePercent = 0;
  let direction: 'up' | 'down' | 'flat' = 'flat';
  if (prevRate && prevRate !== rate) {
    changePercent = ((rate - prevRate) / prevRate) * 100;
    direction = rate > prevRate ? 'up' : 'down';
  }

  const changeColor = direction === 'up' ? '#0ECB81' : direction === 'down' ? '#F6465D' : '#94a3b8';

  return (
    <div
      className={`glass-card-light slide-up ${direction === 'up' ? 'rate-up' : direction === 'down' ? 'rate-down' : ''}`}
      style={{
        padding: '16px 20px',
        transition: 'all 0.2s ease',
        cursor: 'pointer',
        position: 'relative',
        overflow: 'hidden',
        border: isActive ? `2px solid ${meta.color}` : '1px solid var(--color-border)',
        boxShadow: isActive ? `0 0 0 3px ${meta.color}18` : undefined,
      }}
      onClick={() => setSelectedAsset(pair)}
      onMouseEnter={(e) => {
        if (!isActive) {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.borderColor = `${meta.color}55`;
        }
      }}
      onMouseLeave={(e) => {
        if (!isActive) {
          e.currentTarget.style.transform = 'none';
          e.currentTarget.style.borderColor = 'var(--color-border)';
        }
      }}
    >
      {/* Sol şerit */}
      <div style={{
        position: 'absolute', top: 0, left: 0, bottom: 0, width: '3px',
        background: isActive ? meta.color : 'transparent',
        borderRadius: '3px 0 0 3px',
      }} />

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {/* Sol: ikon + isim */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '20px', lineHeight: 1 }}>{meta.icon}</span>
          <div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
              {meta.name}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '1px' }}>
              {meta.short} / TRY
              {(pair === 'GRAM_ALTIN/TRY' || pair === 'GRAM_GUMUS/TRY') && (
                <span style={{ marginLeft: '4px', fontSize: '10px', color: 'var(--color-text-muted)' }}>• gram</span>
              )}
            </div>
          </div>
        </div>

        {/* Sağ: fiyat + değişim */}
        <div style={{ textAlign: 'right' }}>
          <div style={{
            fontSize: '16px',
            fontWeight: 700,
            fontFamily: "'JetBrains Mono', monospace",
            color: 'var(--color-text-primary)',
            letterSpacing: '-0.3px',
          }}>
            {formatRate(rate, pair)}
            <span style={{ fontSize: '11px', fontWeight: 400, color: 'var(--color-text-muted)', marginLeft: '3px' }}>₺</span>
          </div>
          <div style={{
            fontSize: '11px',
            fontWeight: 600,
            color: direction === 'flat' ? 'var(--color-text-muted)' : changeColor,
            marginTop: '2px',
          }}>
            {direction === 'up' ? '▲' : direction === 'down' ? '▼' : '—'}{' '}
            {direction !== 'flat' ? Math.abs(changePercent).toFixed(3) + '%' : '0.000%'}
          </div>
        </div>
      </div>

      {/* Pulse dot */}
      <div style={{
        position: 'absolute', bottom: '8px', right: '10px',
        display: 'flex', alignItems: 'center', gap: '4px',
      }}>
        <div className="pulse-live" style={{
          width: '5px', height: '5px', borderRadius: '50%',
          background: '#0ECB81',
        }} />
      </div>
    </div>
  );
}
