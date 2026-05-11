'use client';

import { useStore } from '@/store/useStore';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { authApi } from '@/lib/api';

export default function ProfilePage() {
  const { user, wallets, rates, clearAuth, setAuth, token } = useStore();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  const [name, setName] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  useEffect(() => {
    setMounted(true);
    if (!user) {
      router.push('/login');
    } else {
      setName(user.name);
    }
  }, [user, router]);

  const totalTryValue = useMemo(() => {
    return wallets.reduce((acc, w) => {
      if (w.currency === 'TRY') return acc + w.balance;
      const rate = rates[`${w.currency}/TRY`] || 0;
      return acc + (w.balance * rate);
    }, 0);
  }, [wallets, rates]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ text: '', type: '' });

    try {
      const payload = {};
      if (name && name !== user?.name) payload.name = name;
      if (newPassword) {
        payload.currentPassword = currentPassword;
        payload.newPassword = newPassword;
      }

      if (Object.keys(payload).length === 0) {
         setMessage({ text: 'Değişiklik yapmadınız.', type: 'error' });
         setLoading(false);
         return;
      }

      const res = await authApi.updateProfile(payload);

      if (token && res.data) {
         setAuth(res.data, token);
      }

      setCurrentPassword('');
      setNewPassword('');
      setMessage({ text: 'Profiliniz başarıyla güncellendi.', type: 'success' });
    } catch (err) {
      setMessage({ text: err.response?.data?.error || 'Güncelleme işlemi başarısız oldu.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  if (!mounted || !user) return null;

  return (
    <div className="container slide-up">
      <div style={{ maxWidth: '800px', margin: '0 auto', paddingTop: '40px' }}>

        <h1 style={{ fontSize: '28px', fontWeight: 800, marginBottom: '24px', color: 'var(--color-text-primary)', letterSpacing: '-0.5px' }}>
          Kullanıcı Profili
        </h1>

        <div className="glass-card" style={{ padding: '30px', marginBottom: '30px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '30px', borderBottom: '1px solid var(--color-border)', paddingBottom: '30px' }}>
            <div style={{
              width: '80px', height: '80px', borderRadius: '50%',
              background: 'linear-gradient(135deg, #007fff, #00bfff)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontSize: '32px', fontWeight: 700,
            }}>
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '4px' }}>
                {user.name}
              </div>
              <div style={{ fontSize: '14px', color: 'var(--color-text-muted)' }}>
                {user.email}
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div style={{ background: 'var(--color-surface-light)', padding: '20px', borderRadius: '12px' }}>
              <div style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginBottom: '8px' }}>
                Hesap Kimliği (ID)
              </div>
              <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--color-text-primary)', fontFamily: "'JetBrains Mono', monospace", wordBreak: 'break-all' }}>
                {user.id}
              </div>
            </div>

            <div style={{ background: 'var(--color-surface-light)', padding: '20px', borderRadius: '12px' }}>
              <div style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginBottom: '8px' }}>
                Toplam Portföy Değeri
              </div>
              <div style={{ fontSize: '20px', fontWeight: 700, color: '#0ECB81', fontFamily: "'JetBrains Mono', monospace" }}>
                {new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(totalTryValue)} ₺
              </div>
            </div>
          </div>
        </div>

        <div className="glass-card" style={{ padding: '30px', marginBottom: '30px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '20px', color: 'var(--color-text-primary)' }}>
            Hesap Ayarları
          </h2>

          <form onSubmit={handleUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '6px' }}>
                İsim Soyisim
              </label>
              <input type="text" className="input-field" value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="İsminizi girin" required />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '10px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '6px' }}>
                  Mevcut Şifre
                </label>
                <input type="password" className="input-field" value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Şifre değişimi için gerekli" />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '6px' }}>
                  Yeni Şifre
                </label>
                <input type="password" className="input-field" value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Yeni şifrenizi girin" />
              </div>
            </div>

            {message.text && (
              <div style={{
                padding: '12px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 500,
                background: message.type === 'success' ? 'rgba(14,203,129,0.1)' : 'rgba(246,70,93,0.1)',
                color: message.type === 'success' ? '#0ECB81' : '#F6465D',
                border: `1px solid ${message.type === 'success' ? 'rgba(14,203,129,0.3)' : 'rgba(246,70,93,0.3)'}`,
              }}>
                {message.text}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
              <button type="submit" disabled={loading} style={{
                padding: '12px 24px', borderRadius: '8px', border: 'none',
                background: 'linear-gradient(135deg, #007fff, #00bfff)',
                color: '#fff', fontSize: '14px', fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1, transition: 'all 0.2s ease',
              }}>
                {loading ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
              </button>
            </div>
          </form>
        </div>

        <div className="glass-card" style={{ padding: '30px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '20px', color: 'var(--color-text-primary)' }}>
            Oturum Yönetimi
          </h2>
          <button
            onClick={() => {
              clearAuth();
              router.push('/login');
            }}
            style={{
              padding: '12px 24px', borderRadius: '8px', border: 'none',
              background: 'linear-gradient(135deg, #F6465D, #dc2626)',
              color: '#fff', fontSize: '14px', fontWeight: 600,
              cursor: 'pointer', transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 16px rgba(246, 70, 93, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'none';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            Hesaptan Çıkış Yap
          </button>
        </div>
      </div>
    </div>
  );
}
