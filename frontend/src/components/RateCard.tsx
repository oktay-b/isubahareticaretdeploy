'use client';

import { useStore } from '@/store/useStore';

interface RateCardProps {
  pair: string;
  rate: number;
}

const currencyFlags: Record<string, string> = {
  'USD': '🇺🇸',
  'EUR': '🇪🇺',
  'GBP': '🇬🇧',
  'TRY': '🇹🇷',
};

const currencyNames: Record<string, string> = {
  'USD/TRY': 'Amerikan Doları',
  'EUR/TRY': 'Euro',
  'GBP/TRY': 'İngiliz Sterlini',
  'USD/EUR': 'Dolar / Euro',
};

export default function RateCard({ pair, rate }: RateCardProps) {
  const { previousRates } = useStore();
  const prevRate = previousRates[pair];
  const [base, quote] = pair.split('/');

  let changeClass = '';
  let changePercent = 0;
  let arrow = '';

  if (prevRate && prevRate !== rate) {
    changePercent = ((rate - prevRate) / prevRate) * 100;
    if (rate > prevRate) {
      changeClass = 'rate-up';
      arrow = '▲';
    } else {
      changeClass = 'rate-down';
      arrow = '▼';
    }
  }

  return (
    <div className={`glass-card-light slide-up ${changeClass}`} style={{
      padding: '20px',
      transition: 'all 0.3s ease',
      cursor: 'pointer',
      position: 'relative',
      overflow: 'hidden',
    }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.3)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.15)';
      }}
    >
      {/* Decorative gradient orb */}
      <div style={{
        position: 'absolute',
        top: '-20px',
        right: '-20px',
        width: '80px',
        height: '80px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(99, 102, 241, 0.15), transparent)',
        pointerEvents: 'none',
      }} />

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '32px' }}>{currencyFlags[base] || '💲'}</span>
          <div>
            <div style={{
              fontSize: '16px',
              fontWeight: 700,
              color: 'var(--color-text-primary)',
              letterSpacing: '0.5px',
            }}>
              {pair}
            </div>
            <div style={{
              fontSize: '12px',
              color: 'var(--color-text-muted)',
              marginTop: '2px',
            }}>
              {currencyNames[pair] || pair}
            </div>
          </div>
        </div>

        <div style={{ textAlign: 'right' }}>
          <div style={{
            fontSize: '22px',
            fontWeight: 700,
            fontFamily: "'JetBrains Mono', monospace",
            color: 'var(--color-text-primary)',
          }}>
            {rate.toFixed(4)}
          </div>
          {changePercent !== 0 && (
            <div style={{
              fontSize: '13px',
              fontWeight: 600,
              color: changePercent > 0 ? 'var(--color-success)' : 'var(--color-danger)',
              marginTop: '4px',
            }}>
              {arrow} {Math.abs(changePercent).toFixed(3)}%
            </div>
          )}
        </div>
      </div>

      {/* Live indicator */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        marginTop: '12px',
        paddingTop: '12px',
        borderTop: '1px solid rgba(51, 65, 85, 0.5)',
      }}>
        <div className="pulse-live" style={{
          width: '6px',
          height: '6px',
          borderRadius: '50%',
          background: 'var(--color-success)',
        }} />
        <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
          Canlı • {quote}
        </span>
      </div>
    </div>
  );
}
