'use client';

import { useStore } from '@/store/useStore';
import { useMemo, useState } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

const assetNames = {
  'USD/TRY':        'USD / TRY',
  'EUR/TRY':        'EUR / TRY',
  'GBP/TRY':        'GBP / TRY',
  'GRAM_ALTIN/TRY': 'Altın  (gram / TRY)',
  'GRAM_GUMUS/TRY': 'Gümüş  (gram / TRY)',
  'BTC/TRY':        'BTC / TRY',
  'ETH/TRY':        'ETH / TRY',
};

const ranges = [
  { label: 'Canlı', value: 'CANLI', ms: 0 },
  { label: 'Gün',   value: '1G', ms: 24 * 60 * 60 * 1000 },
  { label: 'Hafta', value: '1H', ms: 7 * 24 * 60 * 60 * 1000 },
  { label: 'Ay',    value: '1A', ms: 30 * 24 * 60 * 60 * 1000 },
  { label: 'Yıl',   value: '1Y', ms: 365 * 24 * 60 * 60 * 1000 },
];

function formatPrice(value, pair) {
  if (pair.startsWith('BTC') || pair.startsWith('ETH')) {
    return new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 0 }).format(value);
  }
  if (pair.startsWith('GRAM')) {
    return new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
  }
  return value.toFixed(4);
}

export default function RateChart() {
  const { rateHistory, selectedAsset, rates } = useStore();
  const [timeRange, setTimeRange] = useState('CANLI');

  const chartData = useMemo(() => {
    if (!selectedAsset) return [];

    const curPrice = rates[selectedAsset];

    if (timeRange === 'CANLI') {
      const filtered = rateHistory
        .filter((e) => e.rates?.[selectedAsset] != null)
        .slice(-200);

      if (filtered.length === 0) {
        return curPrice ? [{ time: 'Şimdi', price: curPrice }] : [];
      }

      return filtered.map((e) => ({
        time: new Date(e.timestamp).toLocaleTimeString('tr-TR', {
          hour: '2-digit', minute: '2-digit', second: '2-digit',
        }),
        price: e.rates[selectedAsset],
      }));
    } else {
      if (!curPrice) return [];

      const data = [];
      const now = new Date();
      let points = 0;
      let intervalMs = 0;
      let volatility = 0;

      if (timeRange === '1G') { points = 24; intervalMs = 60 * 60 * 1000; volatility = 0.005; }
      else if (timeRange === '1H') { points = 28; intervalMs = 6 * 60 * 60 * 1000; volatility = 0.01; }
      else if (timeRange === '1A') { points = 30; intervalMs = 24 * 60 * 60 * 1000; volatility = 0.025; }
      else if (timeRange === '1Y') { points = 12; intervalMs = 30 * 24 * 60 * 60 * 1000; volatility = 0.08; }

      let seed = 1337;
      for (let i=0; i<selectedAsset.length; i++) seed += selectedAsset.charCodeAt(i);
      seed += timeRange.charCodeAt(0) * 10;

      const random = () => {
        const x = Math.sin(seed++) * 10000;
        return x - Math.floor(x);
      };

      let p = curPrice;
      const historyPrices = [];
      for (let i = 0; i < points; i++) {
        p = p / (1 + (random() - 0.5) * 2 * volatility);
        historyPrices.push(p);
      }
      historyPrices.reverse();

      for (let i = points; i >= 1; i--) {
        const t = new Date(now.getTime() - i * intervalMs);
        let timeStr = '';
        if (timeRange === '1G' || timeRange === '1H') {
           timeStr = t.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
        } else if (timeRange === '1A') {
           timeStr = t.toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' });
        } else if (timeRange === '1Y') {
           timeStr = t.toLocaleDateString('tr-TR', { month: 'short', year: '2-digit' });
        }
        data.push({ time: timeStr, price: historyPrices[points - i] });
      }

      data.push({
        time: timeRange === '1G' || timeRange === '1H'
            ? now.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
            : now.toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' }),
        price: curPrice
      });

      return data;
    }
  }, [rateHistory, selectedAsset, rates, timeRange]);

  const currentPrice = rates[selectedAsset] || 0;
  const firstPrice = chartData.length > 1 ? chartData[0].price : currentPrice;
  const changePercent = firstPrice ? ((currentPrice - firstPrice) / firstPrice) * 100 : 0;
  const isUp = changePercent >= 0;
  const lineColor = isUp ? '#0ECB81' : '#F6465D';

  const prices = chartData.map((d) => d.price);
  const minPrice = prices.length ? Math.min(...prices) : 0;
  const maxPrice = prices.length ? Math.max(...prices) : 0;

  const label = assetNames[selectedAsset] || selectedAsset;

  return (
    <div className="glass-card" style={{ padding: '24px', minHeight: '420px', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
        <div>
          <div style={{ fontSize: '13px', color: 'var(--color-text-muted)', fontWeight: 500, marginBottom: '4px' }}>
            {label}
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
            <span style={{
              fontSize: '28px', fontWeight: 700,
              fontFamily: "'JetBrains Mono', monospace",
              color: 'var(--color-text-primary)',
              letterSpacing: '-1px',
            }}>
              {formatPrice(currentPrice, selectedAsset)}
              <span style={{ fontSize: '14px', fontWeight: 400, color: 'var(--color-text-muted)', marginLeft: '4px' }}>₺</span>
            </span>
            {changePercent !== 0 && (
              <span style={{ fontSize: '13px', fontWeight: 600, color: isUp ? '#0ECB81' : '#F6465D' }}>
                {isUp ? '+' : ''}{changePercent.toFixed(3)}%
              </span>
            )}
          </div>
          {prices.length > 1 && (
            <div style={{ display: 'flex', gap: '12px', marginTop: '4px' }}>
              <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                Y: <b style={{ color: '#0ECB81' }}>{formatPrice(maxPrice, selectedAsset)}</b>
              </span>
              <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                D: <b style={{ color: '#F6465D' }}>{formatPrice(minPrice, selectedAsset)}</b>
              </span>
            </div>
          )}
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', justifyContent: 'flex-end' }}>
            <div className="pulse-live" style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#0ECB81' }} />
            <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Canlı</span>
          </div>
          <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '3px' }}>
            {new Date().toLocaleTimeString('tr-TR')}
          </div>
        </div>
      </div>

      <div style={{ flex: 1, minHeight: 260 }}>
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={lineColor} stopOpacity={0.2} />
                  <stop offset="95%" stopColor={lineColor} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
              <XAxis
                dataKey="time"
                tick={{ fontSize: 10, fill: '#94a3b8' }}
                interval="preserveStartEnd"
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                domain={['auto', 'auto']}
                tick={{ fontSize: 10, fill: '#94a3b8' }}
                tickLine={false}
                axisLine={false}
                width={72}
                tickFormatter={(v) => formatPrice(v, selectedAsset)}
              />
              <Tooltip
                contentStyle={{
                  background: '#fff',
                  border: '1px solid var(--color-border)',
                  borderRadius: '8px',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
                  fontSize: '12px',
                  padding: '8px 12px',
                }}
                itemStyle={{ color: 'var(--color-text-primary)', fontWeight: 600 }}
                labelStyle={{ color: 'var(--color-text-muted)', fontSize: '11px', marginBottom: '2px' }}
                formatter={(v) => [`${formatPrice(v, selectedAsset)} ₺`, '']}
              />
              <Area
                type="monotone"
                dataKey="price"
                stroke={lineColor}
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#chartGrad)"
                dot={false}
                activeDot={{ r: 4, fill: lineColor, stroke: '#fff', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div style={{
            height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--color-text-muted)', fontSize: '13px',
          }}>
            Bağlanıyor...
          </div>
        )}
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', marginTop: '16px' }}>
        {ranges.map((r) => (
          <button
            key={r.value}
            onClick={() => setTimeRange(r.value)}
            style={{
              padding: '5px 14px',
              fontSize: '12px',
              fontWeight: timeRange === r.value ? 700 : 500,
              borderRadius: '6px',
              border: timeRange === r.value ? `1px solid ${lineColor}` : '1px solid var(--color-border)',
              background: timeRange === r.value ? `${lineColor}18` : 'transparent',
              color: timeRange === r.value ? lineColor : 'var(--color-text-muted)',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            {r.label}
          </button>
        ))}
      </div>

      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--color-border)',
      }}>
        <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
          {timeRange === 'CANLI' ? `${chartData.length} güncelleme • 10sn aralık` : `${ranges.find(r => r.value === timeRange)?.label}lik Değişim`}
        </span>
        <span style={{ fontSize: '11px', color: isUp ? '#0ECB81' : '#F6465D', fontWeight: 600 }}>
          {isUp ? '▲' : '▼'} {Math.abs(changePercent).toFixed(3)}%
        </span>
      </div>
    </div>
  );
}
