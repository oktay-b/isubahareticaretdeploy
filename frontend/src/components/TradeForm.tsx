'use client';

import { useState, useMemo } from 'react';
import { useStore } from '@/store/useStore';
import { tradeApi, walletApi } from '@/lib/api';


const ASSET_INFO: Record<string, { label: string; unit: string; icon: string; priceDecimals: number; qtyDecimals: number }> = {
  USD:        { label: 'Amerikan Doları', unit: 'USD',  icon: '$',  priceDecimals: 4, qtyDecimals: 4 },
  EUR:        { label: 'Euro',            unit: 'EUR',  icon: '€',  priceDecimals: 4, qtyDecimals: 4 },
  GBP:        { label: 'İng. Sterlini',  unit: 'GBP',  icon: '£',  priceDecimals: 4, qtyDecimals: 4 },
  GRAM_ALTIN: { label: 'Altın',          unit: 'gram', icon: '🥇', priceDecimals: 2, qtyDecimals: 4 },
  GRAM_GUMUS: { label: 'Gümüş',          unit: 'gram', icon: '🥈', priceDecimals: 2, qtyDecimals: 4 },
  BTC:        { label: 'Bitcoin',        unit: 'BTC',  icon: '₿',  priceDecimals: 0, qtyDecimals: 8 },
  ETH:        { label: 'Ethereum',       unit: 'ETH',  icon: 'Ξ',  priceDecimals: 0, qtyDecimals: 6 },
};

const HIDDEN = new Set(['CEYREK_ALTIN', 'YARIM_ALTIN', 'TAM_ALTIN', 'CUMHURIYET_ALTINI']);
const GRAM_ASSETS = new Set(['GRAM_ALTIN', 'GRAM_GUMUS']);


function n(val: number, dec: number): string {
  return new Intl.NumberFormat('tr-TR', { minimumFractionDigits: dec, maximumFractionDigits: dec }).format(val);
}


export default function TradeForm() {
  const { rates, setWallets, wallets } = useStore();

  // API'den gelen semboller filtrelenmiş
  const assets = useMemo(() =>
    Object.keys(rates)
      .map((p) => p.split('/')[0])
      .filter((s) => s !== 'TRY' && !HIDDEN.has(s)),
    [rates]
  );

  const [mode,      setMode]      = useState<'BUY' | 'SELL'>('BUY');
  const [inputType, setInputType] = useState<'TRY' | 'ASSET'>('TRY');
  const [asset,     setAsset]     = useState('USD');
  const [amount,    setAmount]    = useState('');
  const [loading,   setLoading]   = useState(false);
  const [result,    setResult]    = useState<{ text: string; ok: boolean } | null>(null);

  const info        = ASSET_INFO[asset] ?? { label: asset, unit: asset, icon: '📊', priceDecimals: 4, qtyDecimals: 6 };
  const isGram      = GRAM_ASSETS.has(asset);
  const midPrice    = rates[`${asset}/TRY`] || 0;
  const SPREAD      = 0.005;
  const buyPrice    = midPrice * (1 + SPREAD);
  const sellPrice   = midPrice * (1 - SPREAD);
  const tryBalance  = wallets.find((w) => w.currency === 'TRY')?.balance ?? 0;
  const assetBal    = wallets.find((w) => w.currency === asset)?.balance ?? 0;
  const numAmount   = parseFloat(amount) || 0;
  const isTryInput  = inputType === 'TRY';

  const buyCost     = mode === 'BUY' ? (isTryInput ? numAmount : numAmount * buyPrice) : 0;
  const buyQty      = mode === 'BUY' ? (isTryInput ? (buyPrice > 0 ? numAmount / buyPrice : 0) : numAmount) : 0;
  const sellRevenue = mode === 'SELL' ? (isTryInput ? numAmount : numAmount * sellPrice) : 0;
  const sellQty     = mode === 'SELL' ? (isTryInput ? (sellPrice > 0 ? numAmount / sellPrice : 0) : numAmount) : 0;

  const maxForPct = mode === 'SELL'
    ? (isTryInput ? assetBal * sellPrice : assetBal)
    : (isTryInput ? tryBalance : (buyPrice > 0 ? tryBalance / buyPrice : 0));

  const handleTrade = async () => {
    if (numAmount <= 0) { setResult({ text: 'Geçerli bir miktar giriniz.', ok: false }); return; }
    if (!midPrice)      { setResult({ text: 'Fiyat bekleniyor, lütfen bekleyiniz.', ok: false }); return; }

    let quantity = mode === 'BUY' ? buyQty : sellQty;

    if (quantity < 0.000001) {
      setResult({ text: 'Miktar çok küçük.', ok: false });
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const payload = { symbol: asset, quantity: parseFloat(quantity.toFixed(8)) };

      if (mode === 'BUY') {
        const res = await tradeApi.buy(payload);
        const d   = res.data;
        const gotQty   = Number(d.quantity ?? quantity);
        const paidTRY  = Number(d.total    ?? buyCost ?? 0);
        const rate     = Number(d.price    ?? buyPrice);

        const msg = isGram
          ? `✓ ${n(gotQty, info.qtyDecimals)} gram ${info.label} alındı — ${n(paidTRY, 2)} ₺ ödendi (${n(rate, info.priceDecimals)} ₺/gram)`
          : `✓ ${n(gotQty, info.qtyDecimals)} ${info.unit} alındı — ${n(paidTRY, 2)} ₺ ödendi (kur: ${n(rate, info.priceDecimals)} ₺)`;
        setResult({ text: msg, ok: true });

      } else {
        const res = await tradeApi.sell(payload);
        const d   = res.data;
        const soldQty  = Number(d.quantity ?? quantity);
        const gotTRY   = Number(d.total    ?? sellRevenue ?? 0);
        const rate     = Number(d.price    ?? sellPrice);

        const msg = isGram
          ? `✓ ${n(soldQty, info.qtyDecimals)} gram ${info.label} satıldı — ${n(gotTRY, 2)} ₺ kazanıldı (${n(rate, info.priceDecimals)} ₺/gram)`
          : `✓ ${n(soldQty, info.qtyDecimals)} ${info.unit} satıldı — ${n(gotTRY, 2)} ₺ kazanıldı (kur: ${n(rate, info.priceDecimals)} ₺)`;
        setResult({ text: msg, ok: true });
      }

      const walletRes = await walletApi.getWallets();
      setWallets(walletRes.data);
      setAmount('');
    } catch (err: any) {
      setResult({ text: err.response?.data?.error || 'İşlem gerçekleştirilemedi.', ok: false });
    } finally {
      setLoading(false);
    }
  };

  // ── Etiketler ──
  const inputSuffix = inputType === 'TRY' ? '₺' : info.unit;

  const balanceHint = mode === 'BUY'
    ? `Bakiye: ${n(tryBalance, 2)} ₺`
    : `Bakiye: ${n(assetBal, info.qtyDecimals)} ${info.unit}`;

  const submitLabel = loading
    ? 'İşlem yapılıyor...'
    : mode === 'BUY'
      ? `${info.label} Satın Al`
      : `${info.label} Sat`;

  // Özet satırı kur gösterimi
  const kurLabel = isGram
    ? `1 gram ${info.label}`
    : `1 ${info.unit}`;

  return (
    <div className="glass-card slide-up" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>

      {/* Başlık */}
      <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-text-primary)' }}>
        İşlem Ekranı
      </div>

      {/* AL / SAT toggle */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr',
        background: 'var(--color-surface-light)', borderRadius: '8px',
        padding: '3px', gap: '3px',
      }}>
        {(['BUY', 'SELL'] as const).map((m) => (
          <button key={m}
            onClick={() => { setMode(m); setAmount(''); setResult(null); }}
            style={{
              padding: '9px', borderRadius: '6px', border: 'none',
              fontWeight: 700, fontSize: '13px', cursor: 'pointer', transition: 'all 0.15s',
              background: mode === m ? (m === 'BUY' ? '#0ECB81' : '#F6465D') : 'transparent',
              color: mode === m ? '#fff' : 'var(--color-text-muted)',
            }}
          >
            {m === 'BUY' ? 'AL' : 'SAT'}
          </button>
        ))}
      </div>

      {/* Varlık seç */}
      <div>
        <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Varlık
        </label>
        <select className="select-field" value={asset} style={{ fontWeight: 600 }}
          onChange={(e) => { setAsset(e.target.value); setAmount(''); setResult(null); }}>
          {assets.map((sym) => (
            <option key={sym} value={sym}>
              {ASSET_INFO[sym]?.icon} {ASSET_INFO[sym]?.label || sym}
            </option>
          ))}
        </select>

        {/* Alış / Satış fiyatı */}
        {midPrice > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '7px', padding: '6px 10px', background: 'var(--color-surface-light)', borderRadius: '6px' }}>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: '10px', color: 'var(--color-text-muted)', marginBottom: '1px' }}>Alış</div>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#0ECB81', fontFamily: "'JetBrains Mono', monospace" }}>
                {n(buyPrice, info.priceDecimals)} ₺
              </div>
            </div>
            <div style={{ textAlign: 'center', alignSelf: 'center' }}>
              <div style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>
                {isGram ? `gram ${info.label}` : `${info.unit} / TRY`}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '10px', color: 'var(--color-text-muted)', marginBottom: '1px' }}>Satış</div>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#F6465D', fontFamily: "'JetBrains Mono', monospace" }}>
                {n(sellPrice, info.priceDecimals)} ₺
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Miktar */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', alignItems: 'center' }}>
          <div style={{ display: 'flex', background: 'var(--color-surface-light)', borderRadius: '6px', padding: '3px' }}>
            <button
              onClick={() => { setInputType('TRY'); setAmount(''); setResult(null); }}
              style={{
                padding: '4px 10px', fontSize: '11px', fontWeight: 600, cursor: 'pointer', border: 'none', borderRadius: '4px',
                background: inputType === 'TRY' ? 'var(--color-surface)' : 'transparent',
                color: inputType === 'TRY' ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
                boxShadow: inputType === 'TRY' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                transition: 'all 0.2s',
              }}
            >
              Tutar (₺)
            </button>
            <button
              onClick={() => { setInputType('ASSET'); setAmount(''); setResult(null); }}
              style={{
                padding: '4px 10px', fontSize: '11px', fontWeight: 600, cursor: 'pointer', border: 'none', borderRadius: '4px',
                background: inputType === 'ASSET' ? 'var(--color-surface)' : 'transparent',
                color: inputType === 'ASSET' ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
                boxShadow: inputType === 'ASSET' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                transition: 'all 0.2s',
              }}
            >
              Miktar ({info.unit})
            </button>
          </div>
          <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>{balanceHint}</span>
        </div>

        <div style={{ position: 'relative' }}>
          <input
            type="number" className="input-field"
            placeholder="0" value={amount} min="0" step="any"
            onChange={(e) => { setAmount(e.target.value); setResult(null); }}
            style={{ paddingRight: '60px', fontFamily: "'JetBrains Mono', monospace", fontWeight: 600, fontSize: '16px' }}
          />
          <span style={{
            position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)',
            fontSize: '12px', fontWeight: 700, color: 'var(--color-text-muted)',
          }}>
            {inputSuffix}
          </span>
        </div>

        {/* % hızlı butonlar */}
        <div style={{ display: 'flex', gap: '5px', marginTop: '7px' }}>
          {[25, 50, 75, 100].map((pct) => {
            const val = (maxForPct * pct) / 100;
            return (
              <button key={pct}
                onClick={() => { setAmount(val.toFixed(8)); setResult(null); }}
                style={{
                  flex: 1, padding: '4px 0', borderRadius: '5px',
                  border: '1px solid var(--color-border)',
                  fontSize: '11px', fontWeight: 600, cursor: 'pointer',
                  background: 'transparent', color: 'var(--color-text-muted)', transition: 'all 0.15s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-surface-light)'; e.currentTarget.style.color = 'var(--color-text-primary)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--color-text-muted)'; }}
              >
                {pct}%
              </button>
            );
          })}
        </div>
      </div>

      {/* Sipariş özeti */}
      {numAmount > 0 && midPrice > 0 && (
        <div style={{
          background: 'var(--color-surface-light)', border: '1px solid var(--color-border)',
          borderRadius: '10px', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: '6px',
        }}>
          {/* Kur */}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
            <span style={{ color: 'var(--color-text-muted)' }}>
              {mode === 'BUY' ? 'Alış kuru' : 'Satış kuru'}
            </span>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 600, color: 'var(--color-text-primary)' }}>
              {kurLabel} = {n(mode === 'BUY' ? buyPrice : sellPrice, info.priceDecimals)} ₺
            </span>
          </div>

          <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '6px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {mode === 'BUY' && (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>Toplam ödeme</span>
                  <span style={{ fontSize: '14px', fontWeight: 700, color: '#0ECB81', fontFamily: "'JetBrains Mono', monospace" }}>
                    {n(buyCost, 2)} ₺
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>Alınacak miktar</span>
                  <span style={{ fontSize: '14px', fontWeight: 700, color: '#0ECB81', fontFamily: "'JetBrains Mono', monospace" }}>
                    {n(buyQty, info.qtyDecimals)} {info.unit}
                  </span>
                </div>
              </>
            )}

            {mode === 'SELL' && (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>Kazanılacak TRY</span>
                  <span style={{ fontSize: '14px', fontWeight: 700, color: '#F6465D', fontFamily: "'JetBrains Mono', monospace" }}>
                    {n(sellRevenue, 2)} ₺
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>Satılacak miktar</span>
                  <span style={{ fontSize: '14px', fontWeight: 700, color: '#F6465D', fontFamily: "'JetBrains Mono', monospace" }}>
                    {n(sellQty, info.qtyDecimals)} {info.unit}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Geri bildirim */}
      {result && (
        <div style={{
          padding: '10px 14px', borderRadius: '8px', fontSize: '12px', lineHeight: 1.6,
          background: result.ok ? 'rgba(14,203,129,0.08)' : 'rgba(246,70,93,0.08)',
          border: `1px solid ${result.ok ? 'rgba(14,203,129,0.3)' : 'rgba(246,70,93,0.3)'}`,
          color: result.ok ? '#0ECB81' : '#F6465D',
        }}>
          {result.text}
        </div>
      )}

      {/* Gönder butonu */}
      <button
        onClick={handleTrade}
        disabled={loading || numAmount <= 0}
        style={{
          width: '100%', padding: '13px', borderRadius: '8px', border: 'none',
          fontWeight: 700, fontSize: '14px', letterSpacing: '0.3px', transition: 'all 0.15s',
          cursor: loading || numAmount <= 0 ? 'not-allowed' : 'pointer',
          opacity: numAmount <= 0 ? 0.45 : 1,
          background: mode === 'BUY'
            ? 'linear-gradient(135deg, #0ECB81, #059669)'
            : 'linear-gradient(135deg, #F6465D, #dc2626)',
          color: '#fff',
        }}
        onMouseEnter={(e) => {
          if (!loading && numAmount > 0) {
            (e.currentTarget as HTMLButtonElement).style.opacity = '0.88';
            (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)';
          }
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.opacity = numAmount <= 0 ? '0.45' : '1';
          (e.currentTarget as HTMLButtonElement).style.transform = 'none';
        }}
      >
        {submitLabel}
      </button>
    </div>
  );
}
