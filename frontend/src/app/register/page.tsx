'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authApi } from '@/lib/api';
import { useStore } from '@/store/useStore';

export default function RegisterPage() {
  const router = useRouter();
  const { setAuth } = useStore();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (password !== confirmPassword) {
      setError('Şifreler eşleşmiyor.');
      setLoading(false);
      return;
    }

    try {
      const res = await authApi.register({ name, email, password });
      setAuth(res.data.user, res.data.token);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Kayıt başarısız oldu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="gradient-bg" style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
    }}>
      <div className="glass-card slide-up" style={{
        width: '100%',
        maxWidth: '440px',
        padding: '40px',
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
          <div style={{ fontSize: '40px', marginBottom: '12px' }}>💹</div>
          <h1 style={{
            fontSize: '28px',
            fontWeight: 800,
            background: 'linear-gradient(135deg, var(--color-primary-light), var(--color-accent))',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            marginBottom: '8px',
          }}>
            Hesap Oluştur
          </h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '14px' }}>
            Hemen kayıt olun ve 100.000₺ demo bakiye ile başlayın
          </p>
        </div>

        {/* Error */}
        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '10px',
            padding: '12px',
            marginBottom: '20px',
            color: 'var(--color-danger)',
            fontSize: '13px',
            textAlign: 'center',
          }}>
            ❌ {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '18px' }}>
            <label style={{
              display: 'block',
              fontSize: '13px',
              fontWeight: 500,
              color: 'var(--color-text-secondary)',
              marginBottom: '8px',
            }}>
              Ad Soyad
            </label>
            <input
              type="text"
              className="input-field"
              placeholder="Ahmet Yılmaz"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              minLength={2}
              id="register-name"
            />
          </div>

          <div style={{ marginBottom: '18px' }}>
            <label style={{
              display: 'block',
              fontSize: '13px',
              fontWeight: 500,
              color: 'var(--color-text-secondary)',
              marginBottom: '8px',
            }}>
              E-posta
            </label>
            <input
              type="email"
              className="input-field"
              placeholder="ornek@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              id="register-email"
            />
          </div>

          <div style={{ marginBottom: '18px' }}>
            <label style={{
              display: 'block',
              fontSize: '13px',
              fontWeight: 500,
              color: 'var(--color-text-secondary)',
              marginBottom: '8px',
            }}>
              Şifre
            </label>
            <input
              type="password"
              className="input-field"
              placeholder="En az 6 karakter"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              id="register-password"
            />
          </div>

          <div style={{ marginBottom: '28px' }}>
            <label style={{
              display: 'block',
              fontSize: '13px',
              fontWeight: 500,
              color: 'var(--color-text-secondary)',
              marginBottom: '8px',
            }}>
              Şifre Tekrar
            </label>
            <input
              type="password"
              className="input-field"
              placeholder="Şifrenizi tekrar giriniz"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
              id="register-confirm-password"
            />
          </div>

          <button
            type="submit"
            className="btn-primary"
            disabled={loading}
            style={{ width: '100%', padding: '14px', fontSize: '16px' }}
            id="register-submit"
          >
            {loading ? '⏳ Kayıt yapılıyor...' : 'Kayıt Ol'}
          </button>
        </form>

        {/* Login link */}
        <div style={{
          textAlign: 'center',
          marginTop: '24px',
          fontSize: '14px',
          color: 'var(--color-text-muted)',
        }}>
          Zaten hesabınız var mı?{' '}
          <Link href="/login" style={{
            color: 'var(--color-primary-light)',
            textDecoration: 'none',
            fontWeight: 600,
          }}>
            Giriş Yapın
          </Link>
        </div>

        {/* Info */}
        <div style={{
          marginTop: '20px',
          padding: '12px',
          borderRadius: '8px',
          background: 'rgba(6, 182, 212, 0.08)',
          border: '1px solid rgba(6, 182, 212, 0.2)',
          textAlign: 'center',
        }}>
          <span style={{ fontSize: '12px', color: 'var(--color-accent)' }}>
            💡 Kayıt olduğunuzda 100.000₺ demo bakiye ile başlarsınız
          </span>
        </div>
      </div>
    </div>
  );
}
