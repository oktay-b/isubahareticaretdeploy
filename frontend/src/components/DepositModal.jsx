'use client';

import { useState } from 'react';
import { walletApi } from '@/lib/api';

export default function DepositModal({ onClose, onSuccess }) {
  const [raw, setRaw] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  function validate(value) {
    if (!value.trim()) return 'Lütfen bir tutar girin.';
    const num = Number(value.replace(',', '.'));
    if (isNaN(num)) return 'Geçerli bir sayı girin.';
    if (num <= 0) return 'Tutar 0\'dan büyük olmalı.';
    if (num < 100) return 'Minimum yükleme tutarı 100 ₺.';
    if (num > 1_000_000) return 'Maksimum yükleme tutarı 1.000.000 ₺.';
    return null;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const err = validate(raw);
    if (err) { setError(err); return; }

    setLoading(true);
    setError('');
    try {
      const amount = Number(raw.replace(',', '.'));
      await walletApi.deposit(amount);
      setSuccess(true);
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.error || 'Bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="glass-card" style={{ width: '100%', maxWidth: '400px', padding: '32px', margin: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-text-primary)', margin: 0 }}>
            Bakiye Yükle
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--color-text-muted)', fontSize: '20px', lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>

        {success ? (
          <div style={{ textAlign: 'center', padding: '16px 0' }}>
            <div style={{ fontSize: '14px', color: 'var(--color-success)', fontWeight: 600, marginBottom: '16px' }}>
              Bakiye başarıyla yüklendi.
            </div>
            <button className="btn-primary" onClick={onClose} style={{ width: '100%' }}>
              Kapat
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', color: 'var(--color-text-muted)', marginBottom: '8px' }}>
                Tutar (₺)
              </label>
              <input
                type="text"
                inputMode="decimal"
                value={raw}
                onChange={(e) => { setRaw(e.target.value); setError(''); }}
                placeholder="Örn: 1000"
                autoFocus
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  border: `1px solid ${error ? 'var(--color-danger)' : 'var(--color-border)'}`,
                  background: 'var(--color-surface)',
                  color: 'var(--color-text-primary)',
                  fontSize: '15px',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
              {error && (
                <div style={{ fontSize: '12px', color: 'var(--color-danger)', marginTop: '6px' }}>
                  {error}
                </div>
              )}
              <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '6px' }}>
                Min: 100 ₺ — Maks: 1.000.000 ₺
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '20px' }}>
              {[500, 1000, 5000, 10000].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => { setRaw(String(preset)); setError(''); }}
                  style={{
                    padding: '6px 12px', borderRadius: '6px', fontSize: '12px',
                    border: '1px solid var(--color-border)',
                    background: raw === String(preset) ? 'var(--color-accent)' : 'transparent',
                    color: raw === String(preset) ? '#fff' : 'var(--color-text-muted)',
                    cursor: 'pointer',
                  }}
                >
                  {preset.toLocaleString('tr-TR')} ₺
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={onClose}
                style={{
                  flex: 1, padding: '10px 24px', borderRadius: '10px',
                  border: '1px solid var(--color-border)', background: 'transparent',
                  color: 'var(--color-text-muted)', fontWeight: 600, cursor: 'pointer',
                }}
              >
                İptal
              </button>
              <button
                type="submit"
                className="btn-primary"
                disabled={loading}
                style={{ flex: 1 }}
              >
                {loading ? 'Yükleniyor...' : 'Yükle'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
