'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated } from '@/lib/auth';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated()) {
      router.push('/dashboard');
    } else {
      router.push('/login');
    }
  }, [router]);

  return (
    <div className="gradient-bg" style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <div style={{ textAlign: 'center' }}>
        <div className="pulse-live" style={{ fontSize: '48px', marginBottom: '16px' }}></div>
        <div style={{ color: 'var(--color-text-muted)', fontSize: '14px' }}>
          Yönlendiriliyorsunuz...
        </div>
      </div>
    </div>
  );
}
