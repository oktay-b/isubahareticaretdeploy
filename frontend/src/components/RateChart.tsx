'use client';

import { useStore } from '@/store/useStore';
import { useState, useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

export default function RateChart() {
  const { rateHistory, selectedAsset, rates } = useStore();
  const [timeframe, setTimeframe] = useState('1 Gün');

  const timeframeConfig: Record<string, { points: number; interval: number; label: string }> = {
    '1 Gün': { points: 24, interval: 3600000, label: 'Saatlik' }, // 1 hour steps
    '1 Hafta': { points: 7, interval: 86400000, label: 'Günlük' }, // 1 day steps
    '1 Ay': { points: 30, interval: 86400000, label: 'Günlük' }, // 1 day steps
    '1 Yıl': { points: 52, interval: 604800000, label: 'Haftalık' }, // 1 week steps
  };

  // Simulation Logic: Generate mock historical data based on timeframe
  const chartData = useMemo(() => {
    const config = timeframeConfig[timeframe] || timeframeConfig['1 Gün'];
    const currentPrice = rates[selectedAsset] || 1.0;
    const simulatedPoints = [];
    const now = Date.now();
    
    for (let i = config.points; i >= 0; i--) {
      const timestamp = now - i * config.interval;
      const date = new Date(timestamp);
      
      // Random walk simulation with small trend
      const randomFactor = 1 + (Math.random() - 0.5) * 0.02; 
      const simulatedPrice = currentPrice * randomFactor;
      
      let timeLabel = '';
      if (timeframe === '1 Gün') {
        timeLabel = date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
      } else {
        timeLabel = date.toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' });
      }

      simulatedPoints.push({
        time: timeLabel,
        price: i === 0 ? currentPrice : simulatedPrice, // Ensure last point is live
      });
    }
    return simulatedPoints;
  }, [selectedAsset, rates, timeframe]);

  const currentPrice = rates[selectedAsset] || 0;

  return (
    <div className="glass-card" style={{ padding: '24px', minHeight: '440px' }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '24px',
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h3 style={{
              fontSize: '18px',
              fontWeight: 700,
              color: 'var(--color-text-primary)',
            }}>
              {selectedAsset} Analizi
            </h3>
            <span style={{
              fontSize: '12px',
              padding: '2px 8px',
              borderRadius: '4px',
              background: 'rgba(0, 127, 255, 0.1)',
              color: '#007fff',
              fontWeight: 600
            }}>
              Canlı Simülasyon
            </span>
          </div>
          <p style={{
            fontSize: '24px',
            fontWeight: 800,
            color: 'var(--color-text-primary)',
            marginTop: '8px',
            fontFamily: "'JetBrains Mono', monospace"
          }}>
            {currentPrice.toFixed(4)}
          </p>
        </div>
        
        <div style={{ textAlign: 'right' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            justifyContent: 'flex-end'
          }}>
            <div className="pulse-live" style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: 'var(--color-success)',
            }} />
            <span style={{ fontSize: '13px', color: 'var(--color-text-muted)', fontWeight: 500 }}>
              Piyasa Açık
            </span>
          </div>
          <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
            Son Güncelleme: {new Date().toLocaleTimeString()}
          </div>
        </div>
      </div>

      <div style={{ width: '100%', height: 300 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#007fff" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#007fff" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(200, 200, 200, 0.2)" />
            <XAxis 
              dataKey="time" 
              hide={true}
            />
            <YAxis 
              hide={true}
              domain={['auto', 'auto']}
            />
            <Tooltip
              contentStyle={{
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: '12px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              }}
              itemStyle={{ color: '#000000', fontWeight: 700 }}
              labelStyle={{ color: '#666666', marginBottom: '4px' }}
            />
            <Area
              type="monotone"
              dataKey="price"
              stroke="#007fff"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#colorPrice)"
              animationDuration={1500}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        marginTop: '16px',
        paddingTop: '16px',
        borderTop: '1px solid var(--color-border)'
      }}>
        {['1 Gün', '1 Hafta', '1 Ay', '1 Yıl'].map((t) => (
          <button
            key={t}
            onClick={() => setTimeframe(t)}
            style={{
              background: timeframe === t ? 'rgba(0, 127, 255, 0.15)' : 'transparent',
              border: 'none',
              padding: '6px 12px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: 600,
              color: timeframe === t ? '#007fff' : 'var(--color-text-muted)',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            {t}
          </button>
        ))}
      </div>
    </div>
  );
}
