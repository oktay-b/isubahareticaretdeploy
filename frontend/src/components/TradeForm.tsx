'use client';

import { useState } from 'react';
import { useStore } from '@/store/useStore';
import { tradeApi, walletApi } from '@/lib/api';

const currencies = ['TRY', 'USD', 'EUR', 'GBP'];

export default function TradeForm() {
  const { rates, setWallets, wallets } = useStore();
  const [mode, setMode] = useState<'BUY' | 'SELL'>('BUY');
  const [fromCurrency, setFromCurrency] = useState('TRY');
  const [toCurrency, setToCurrency] = useState('USD');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Calculate estimated result
  const getEstimate = () => {
    if (!amount || isNaN(Number(amount))) return null;
    const numAmount = Number(amount);

    // Try to find rate
    const directPair = `${fromCurrency}/${toCurrency}`;
    const reversePair = `${toCurrency}/${fromCurrency}`;

    if (rates[directPair]) {
      return mode === 'BUY'
        ? (numAmount / rates[directPair]).toFixed(4)
        : (numAmount * rates[directPair]).toFixed(4);
    }
    if (rates[reversePair]) {
      return mode === 'BUY'
        ? (numAmount * rates[reversePair]).toFixed(4)
        : (numAmount / rates[reversePair]).toFixed(4);
    }

    // Cross via TRY
    const fromTry = rates[`${fromCurrency}/TRY`];
    const toTry = rates[`${toCurrency}/TRY`];
    if (fromTry && toTry) {
      const cross = fromTry / toTry;
      return mode === 'BUY'
        ? (numAmount / cross).toFixed(4)
        : (numAmount * cross).toFixed(4);
    }

    return null;
  };

  const getBalance = (currency: string) => {
    const wallet = wallets.find((w) => w.currency === currency);
    return wallet ? wallet.balance : 0;
  };

  const handleTrade = async () => {
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      setError('Lütfen geçerli bir miktar giriniz.');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const data = {
        fromCurrency,
        toCurrency,
        amount: Number(amount),
      };

      if (mode === 'BUY') {
        const res = await tradeApi.buy(data);
        setResult(
          `${res.data.amount.toFixed(2)} ${fromCurrency} ile ${res.data.total.toFixed(4)} ${toCurrency} satın aldınız. Kur: ${res.data.rate.toFixed(4)}`
        );
      } else {
        const res = await tradeApi.sell(data);
        setResult(
          `${res.data.amount.toFixed(2)} ${fromCurrency} sattınız ve ${res.data.total.toFixed(4)} ${toCurrency} kazandınız. Kur: ${res.data.rate.toFixed(4)}`
        );
      }

      // Refresh wallets
      const walletRes = await walletApi.getWallets();
      setWallets(walletRes.data);
      setAmount('');
    } catch (err: any) {
      setError(err.response?.data?.error || 'İşlem başarısız oldu.');
    } finally {
      setLoading(false);
    }
  };

  const estimate = getEstimate();

  return (
    <div className="glass-card slide-up" style={{ padding: '28px' }}>
      <h3 style={{
        fontSize: '18px',
        fontWeight: 700,
        marginBottom: '24px',
        color: 'var(--color-text-primary)',
      }}>
        Hızlı İşlem
      </h3>

      {/* Mode Toggle */}
      <div style={{
        display: 'flex',
        gap: '4px',
        marginBottom: '20px',
        background: 'var(--color-surface)',
        borderRadius: '10px',
        padding: '4px',
      }}>
        <button
          onClick={() => setMode('BUY')}
          style={{
            flex: 1,
            padding: '10px',
            borderRadius: '8px',
            border: 'none',
            fontWeight: 600,
            fontSize: '14px',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            background: mode === 'BUY'
              ? 'linear-gradient(135deg, var(--color-success), #059669)'
              : 'transparent',
            color: mode === 'BUY' ? 'white' : 'var(--color-text-muted)',
          }}
        >
          AL (BUY)
        </button>
        <button
          onClick={() => setMode('SELL')}
          style={{
            flex: 1,
            padding: '10px',
            borderRadius: '8px',
            border: 'none',
            fontWeight: 600,
            fontSize: '14px',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            background: mode === 'SELL'
              ? 'linear-gradient(135deg, var(--color-danger), #dc2626)'
              : 'transparent',
            color: mode === 'SELL' ? 'white' : 'var(--color-text-muted)',
          }}
        >
          SAT (SELL)
        </button>
      </div>

      {/* Currency selectors */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
        <div style={{ flex: 1 }}>
          <label style={{
            display: 'block',
            fontSize: '12px',
            color: 'var(--color-text-muted)',
            marginBottom: '6px',
            fontWeight: 500,
          }}>
            {mode === 'BUY' ? 'Harcanan Döviz' : 'Satılan Döviz'}
          </label>
          <select
            className="select-field"
            value={fromCurrency}
            onChange={(e) => setFromCurrency(e.target.value)}
          >
            {currencies.map((c) => (
              <option key={c} value={c}>
                {c} (Bakiye: {getBalance(c).toFixed(2)})
              </option>
            ))}
          </select>
        </div>
        <div style={{
          display: 'flex',
          alignItems: 'flex-end',
          paddingBottom: '12px',
          fontSize: '20px',
          color: 'var(--color-text-muted)',
        }}>
          
        </div>
        <div style={{ flex: 1 }}>
          <label style={{
            display: 'block',
            fontSize: '12px',
            color: 'var(--color-text-muted)',
            marginBottom: '6px',
            fontWeight: 500,
          }}>
            {mode === 'BUY' ? 'Alınan Döviz' : 'Kazanılan Döviz'}
          </label>
          <select
            className="select-field"
            value={toCurrency}
            onChange={(e) => setToCurrency(e.target.value)}
          >
            {currencies.filter((c) => c !== fromCurrency).map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Amount */}
      <div style={{ marginBottom: '16px' }}>
        <label style={{
          display: 'block',
          fontSize: '12px',
          color: 'var(--color-text-muted)',
          marginBottom: '6px',
          fontWeight: 500,
        }}>
          Miktar ({fromCurrency})
        </label>
        <input
          type="number"
          className="input-field"
          placeholder={`${fromCurrency} miktarı giriniz`}
          value={amount}
          onChange={(e) => {
            setAmount(e.target.value);
            setError(null);
            setResult(null);
          }}
          min="0"
          step="any"
        />
      </div>

      {/* Estimate */}
      {estimate && (
        <div style={{
          background: 'rgba(99, 102, 241, 0.08)',
          border: '1px solid rgba(99, 102, 241, 0.2)',
          borderRadius: '10px',
          padding: '14px',
          marginBottom: '16px',
        }}>
          <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
            Tahmini {mode === 'BUY' ? 'alım' : 'satış'} sonucu:
          </span>
          <div style={{
            fontSize: '20px',
            fontWeight: 700,
            color: 'var(--color-primary-light)',
            marginTop: '4px',
          }}>
            ≈ {estimate} {toCurrency}
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div style={{
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: '10px',
          padding: '12px',
          marginBottom: '16px',
          color: 'var(--color-danger)',
          fontSize: '13px',
        }}>
          {error}
        </div>
      )}

      {/* Success */}
      {result && (
        <div style={{
          background: 'rgba(16, 185, 129, 0.1)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          borderRadius: '10px',
          padding: '12px',
          marginBottom: '16px',
          color: 'var(--color-success)',
          fontSize: '13px',
        }}>
          {result}
        </div>
      )}

      {/* Submit */}
      <button
        onClick={handleTrade}
        disabled={loading || !amount}
        className={mode === 'BUY' ? 'btn-success' : 'btn-danger'}
        style={{ width: '100%', padding: '14px', fontSize: '16px' }}
      >
        {loading ? 'İşleniyor...' : mode === 'BUY' ? `${toCurrency} Satın Al` : `${fromCurrency} Sat`}
      </button>
    </div>
  );
}
