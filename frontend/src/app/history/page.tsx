'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated, getUser } from '@/lib/auth';
import { useStore } from '@/store/useStore';
import { tradeApi } from '@/lib/api';
import Navbar from '@/components/Navbar';
import TransactionTable from '@/components/TransactionTable';

export default function HistoryPage() {
  const router = useRouter();
  const { setAuth, transactions, setTransactions } = useStore();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    setMounted(true);
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }

    const savedUser = getUser();
    const token = localStorage.getItem('token');
    if (savedUser && token) {
      setAuth(savedUser, token);
    }

    fetchHistory(1);
  }, []);

  const fetchHistory = async (p: number) => {
    setLoading(true);
    try {
      const res = await tradeApi.getHistory(p, 20);
      setTransactions(res.data.transactions);
      setTotalPages(res.data.pagination.totalPages);
      setPage(p);
    } catch (err) {
      console.error('İşlem geçmişi yüklenemedi:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) return null;

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0c0f1a, #111827)' }}>
      <Navbar />
      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px' }}>
        <div className="slide-up" style={{ marginBottom: '32px' }}>
          <h1 style={{
            fontSize: '28px',
            fontWeight: 800,
            color: 'var(--color-text-primary)',
            marginBottom: '8px',
          }}>
            📋 İşlem Geçmişi
          </h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '14px' }}>
            Tüm alım-satım işlemleriniz
          </p>
        </div>

        {loading ? (
          <div className="glass-card" style={{
            padding: '48px',
            textAlign: 'center',
          }}>
            <div className="pulse-live" style={{ fontSize: '32px', marginBottom: '12px' }}>⏳</div>
            <div style={{ color: 'var(--color-text-muted)', fontSize: '14px' }}>
              Yükleniyor...
            </div>
          </div>
        ) : (
          <>
            <TransactionTable transactions={transactions} />

            {/* Pagination */}
            {totalPages > 1 && (
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                gap: '8px',
                marginTop: '24px',
              }}>
                <button
                  onClick={() => fetchHistory(page - 1)}
                  disabled={page <= 1}
                  className="btn-primary"
                  style={{
                    padding: '8px 16px',
                    fontSize: '13px',
                    opacity: page <= 1 ? 0.5 : 1,
                  }}
                >
                  ← Önceki
                </button>
                <span style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '0 16px',
                  fontSize: '14px',
                  color: 'var(--color-text-secondary)',
                }}>
                  Sayfa {page} / {totalPages}
                </span>
                <button
                  onClick={() => fetchHistory(page + 1)}
                  disabled={page >= totalPages}
                  className="btn-primary"
                  style={{
                    padding: '8px 16px',
                    fontSize: '13px',
                    opacity: page >= totalPages ? 0.5 : 1,
                  }}
                >
                  Sonraki →
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
