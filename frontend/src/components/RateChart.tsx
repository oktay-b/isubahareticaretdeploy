'use client';

import { useStore } from '@/store/useStore';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { useMemo } from 'react';

const lineColors: Record<string, string> = {
  'USD/TRY': '#6366f1',
  'EUR/TRY': '#06b6d4',
  'GBP/TRY': '#f59e0b',
  'USD/EUR': '#10b981',
};

export default function RateChart() {
  const { rateHistory } = useStore();

  const chartData = useMemo(() => {
    return rateHistory.map((entry) => {
      const date = new Date(entry.timestamp);
      return {
        time: date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        ...entry.rates,
      };
    });
  }, [rateHistory]);

  const pairs = useMemo(() => {
    if (chartData.length === 0) return [];
    const latest = chartData[chartData.length - 1];
    return Object.keys(latest).filter((k) => k !== 'time');
  }, [chartData]);

  if (chartData.length < 2) {
    return (
      <div className="glass-card" style={{
        padding: '32px',
        textAlign: 'center',
        color: 'var(--color-text-muted)',
      }}>
        <div style={{ fontSize: '40px', marginBottom: '12px' }}>📈</div>
        <div style={{ fontSize: '14px' }}>
          Grafik verisi yükleniyor... Lütfen birkaç saniye bekleyin.
        </div>
        <div className="pulse-live" style={{
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          background: 'var(--color-accent)',
          margin: '12px auto 0',
        }} />
      </div>
    );
  }

  return (
    <div className="glass-card" style={{ padding: '24px' }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '20px',
      }}>
        <div>
          <h3 style={{
            fontSize: '16px',
            fontWeight: 700,
            color: 'var(--color-text-primary)',
          }}>
            📈 Canlı Kur Grafiği
          </h3>
          <p style={{
            fontSize: '12px',
            color: 'var(--color-text-muted)',
            marginTop: '4px',
          }}>
            Gerçek zamanlı döviz kuru değişimleri
          </p>
        </div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
        }}>
          <div className="pulse-live" style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            background: 'var(--color-success)',
          }} />
          <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
            CANLI
          </span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(51, 65, 85, 0.5)" />
          <XAxis
            dataKey="time"
            stroke="var(--color-text-muted)"
            fontSize={11}
            tickLine={false}
          />
          <YAxis
            stroke="var(--color-text-muted)"
            fontSize={11}
            tickLine={false}
            domain={['auto', 'auto']}
          />
          <Tooltip
            contentStyle={{
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: '8px',
              color: 'var(--color-text-primary)',
              fontSize: '13px',
            }}
          />
          <Legend
            wrapperStyle={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}
          />
          {pairs.map((pair) => (
            <Line
              key={pair}
              type="monotone"
              dataKey={pair}
              stroke={lineColors[pair] || '#6366f1'}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, strokeWidth: 0 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
