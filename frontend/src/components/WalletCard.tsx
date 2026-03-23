'use client';

interface WalletCardProps {
  currency: string;
  balance: number;
}

const currencyConfig: Record<string, { flag: string; name: string; color: string }> = {
  TRY: { flag: '🇹🇷', name: 'Türk Lirası', color: '#ef4444' },
  USD: { flag: '🇺🇸', name: 'Amerikan Doları', color: '#6366f1' },
  EUR: { flag: '🇪🇺', name: 'Euro', color: '#06b6d4' },
  GBP: { flag: '🇬🇧', name: 'İngiliz Sterlini', color: '#f59e0b' },
};

export default function WalletCard({ currency, balance }: WalletCardProps) {
  const config = currencyConfig[currency] || { flag: '💲', name: currency, color: '#6366f1' };

  const formatBalance = (bal: number) => {
    return new Intl.NumberFormat('tr-TR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 4,
    }).format(bal);
  };

  return (
    <div className="glass-card-light slide-up" style={{
      padding: '24px',
      position: 'relative',
      overflow: 'hidden',
    }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = `0 8px 32px ${config.color}22`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      {/* Accent bar */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '3px',
        background: `linear-gradient(90deg, ${config.color}, transparent)`,
      }} />

      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
        <div style={{
          width: '48px',
          height: '48px',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '28px',
          background: `${config.color}15`,
        }}>
          {config.flag}
        </div>
        <div>
          <div style={{
            fontSize: '20px',
            fontWeight: 700,
            color: 'var(--color-text-primary)',
          }}>
            {currency}
          </div>
          <div style={{
            fontSize: '12px',
            color: 'var(--color-text-muted)',
          }}>
            {config.name}
          </div>
        </div>
      </div>

      <div style={{
        fontSize: '28px',
        fontWeight: 700,
        fontFamily: "'JetBrains Mono', monospace",
        color: 'var(--color-text-primary)',
      }}>
        {formatBalance(balance)}
      </div>
      <div style={{
        fontSize: '12px',
        color: 'var(--color-text-muted)',
        marginTop: '4px',
      }}>
        Mevcut Bakiye
      </div>
    </div>
  );
}
