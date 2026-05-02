'use client';

import { useStore } from '@/store/useStore';
import { useMemo } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

const assetNames: Record<string, string> = {
  'USD/TRY':        'USD / TRY',
  'EUR/TRY':        'EUR / TRY',
  'GBP/TRY':        'GBP / TRY',
  'GRAM_ALTIN/TRY': 'Altın  (gram / TRY)',
  'GRAM_GUMUS/TRY': 'Gümüş  (gram / TRY)',
  'BTC/TRY':        'BTC / TRY',
  'ETH/TRY':        'ETH / TRY',
};

function formatPrice(value: number, pair: string): string {
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

  const chartData = useMemo(() => {
    if (!selectedAsset) return [];
    const filtered = rateHistory
      .filter((e) => e.rates?.[selectedAsset] != null)
      .slice(-60);

    if (filtered.length === 0) {
      const cur = rates[selectedAsset];
      return cur ? [{ time: 'Şimdi', price: cur }] : [];
    }

    return filtered.map((entry) => ({
      time: new Date(entry.timestamp).toLocaleTimeString('tr-TR', {
        hour: '2-digit', minute: '2-digit', second: '2-digit',
      }),
      price: entry.rates[selectedAsset],
    }));
  }, [rateHistory, selectedAsset, rates]);

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
      {/* Başlık */}
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
              <span style={{
                fontSize: '13px', fontWeight: 600,
                color: isUp ? '#0ECB81' : '#F6465D',
              }}>
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
            <div className="pulse-live" style={{
              width: '7px', height: '7px', borderRadius: '50%', background: '#0ECB81',
            }} />
            <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Canlı</span>
          </div>
          <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '3px' }}>
            {new Date().toLocaleTimeString('tr-TR')}
          </div>
        </div>
      </div>

      {/* Grafik */}
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
                formatter={(v: number) => [`${formatPrice(v, selectedAsset)} ₺`, '']}
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

      {/* Alt bilgi */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--color-border)',
      }}>
        <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
          {chartData.length} güncelleme • 10sn aralık
        </span>
        <span style={{ fontSize: '11px', color: isUp ? '#0ECB81' : '#F6465D', fontWeight: 600 }}>
          {isUp ? '▲' : '▼'} {Math.abs(changePercent).toFixed(3)}%
        </span>
      </div>
    </div>
  );
}
