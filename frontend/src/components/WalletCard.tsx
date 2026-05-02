'use client';

interface WalletCardProps {
  currency: string;
  balance: number;
}

const assetConfig: Record<string, { icon: string; name: string; unit: string; color: string; decimals: number }> = {
  TRY:               { icon: '₺',  name: 'Türk Lirası',       unit: '₺',    color: '#10b981', decimals: 2 },
  USD:               { icon: '🇺🇸', name: 'Amerikan Doları',   unit: 'USD',  color: '#2563eb', decimals: 4 },
  EUR:               { icon: '🇪🇺', name: 'Euro',              unit: 'EUR',  color: '#7c3aed', decimals: 4 },
  GBP:               { icon: '🇬🇧', name: 'İngiliz Sterlini',  unit: 'GBP',  color: '#0891b2', decimals: 4 },
  GRAM_ALTIN:        { icon: '🥇',  name: 'Altın',             unit: 'gram', color: '#d97706', decimals: 4 },
  GRAM_GUMUS:        { icon: '🥈',  name: 'Gümüş',             unit: 'gram', color: '#64748b', decimals: 4 },
  BTC:               { icon: '₿',   name: 'Bitcoin',            unit: 'BTC',  color: '#f59e0b', decimals: 8 },
  ETH:               { icon: 'Ξ',   name: 'Ethereum',           unit: 'ETH',  color: '#6366f1', decimals: 6 },
};

export default function WalletCard({ currency, balance }: WalletCardProps) {
  const cfg = assetConfig[currency] || {
    icon: '📊', name: currency, unit: currency, color: '#94a3b8', decimals: 4,
  };

  const formatted = new Intl.NumberFormat('tr-TR', {
    minimumFractionDigits: cfg.decimals,
    maximumFractionDigits: cfg.decimals,
  }).format(balance);

  // Sıfır bakiyeli varlıkları soluk göster
  const isEmpty = balance === 0 || balance < 0.000001;

  return (
    <div
      className="glass-card-light slide-up"
      style={{
        padding: '18px 20px',
        position: 'relative',
        overflow: 'hidden',
        opacity: isEmpty ? 0.5 : 1,
        transition: 'all 0.2s ease',
      }}
      onMouseEnter={(e) => {
        if (!isEmpty) {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = `0 8px 24px ${cfg.color}22`;
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'none';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      {/* Üst renk şeridi */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: '2px',
        background: `linear-gradient(90deg, ${cfg.color}, transparent)`,
      }} />

      {/* İkon + isim */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
        <div style={{
          width: '36px', height: '36px', borderRadius: '10px',
          background: `${cfg.color}15`, border: `1px solid ${cfg.color}30`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '18px', flexShrink: 0,
        }}>
          {cfg.icon}
        </div>
        <div>
          <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-text-primary)' }}>
            {cfg.name}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '1px' }}>
            {currency}
            {(currency === 'GRAM_ALTIN' || currency === 'GRAM_GUMUS') && (
              <span style={{ marginLeft: '4px' }}>• gram cinsinden</span>
            )}
          </div>
        </div>
      </div>

      {/* Bakiye */}
      <div style={{
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: currency === 'TRY' ? '20px' : '16px',
        fontWeight: 700,
        color: isEmpty ? 'var(--color-text-muted)' : 'var(--color-text-primary)',
        letterSpacing: '-0.3px',
        lineHeight: 1.2,
      }}>
        {formatted}
        <span style={{ fontSize: '12px', fontWeight: 400, color: 'var(--color-text-muted)', marginLeft: '4px' }}>
          {cfg.unit}
        </span>
      </div>

      {isEmpty && (
        <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
          Bakiye yok
        </div>
      )}
    </div>
  );
}
