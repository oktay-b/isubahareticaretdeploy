'use client';

interface Transaction {
  id: string;
  type: string;
  fromCurrency: string;
  toCurrency: string;
  amount: number;
  rate: number;
  total: number;
  createdAt: string;
}

interface TransactionTableProps {
  transactions: Transaction[];
}

export default function TransactionTable({ transactions }: TransactionTableProps) {
  if (transactions.length === 0) {
    return (
      <div className="glass-card" style={{
        padding: '48px',
        textAlign: 'center',
      }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>📋</div>
        <div style={{
          fontSize: '16px',
          fontWeight: 600,
          color: 'var(--color-text-secondary)',
          marginBottom: '8px',
        }}>
          Henüz işlem yok
        </div>
        <div style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>
          İlk alım-satım işleminizi yapın
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card" style={{ overflow: 'hidden' }}>
      <div style={{ overflowX: 'auto' }}>
        <table style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontSize: '14px',
        }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
              {['Tarih', 'Tür', 'Kaynak', 'Hedef', 'Miktar', 'Kur', 'Toplam'].map((h) => (
                <th
                  key={h}
                  style={{
                    padding: '14px 16px',
                    textAlign: 'left',
                    fontSize: '12px',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    color: 'var(--color-text-muted)',
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {transactions.map((tx, idx) => (
              <tr
                key={tx.id}
                className="fade-in"
                style={{
                  borderBottom: idx < transactions.length - 1 ? '1px solid rgba(51, 65, 85, 0.3)' : 'none',
                  transition: 'background 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(99, 102, 241, 0.05)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                <td style={{ padding: '14px 16px', color: 'var(--color-text-secondary)' }}>
                  {new Date(tx.createdAt).toLocaleDateString('tr-TR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </td>
                <td style={{ padding: '14px 16px' }}>
                  <span style={{
                    display: 'inline-block',
                    padding: '4px 10px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: 600,
                    background: tx.type === 'BUY'
                      ? 'rgba(16, 185, 129, 0.15)'
                      : 'rgba(239, 68, 68, 0.15)',
                    color: tx.type === 'BUY'
                      ? 'var(--color-success)'
                      : 'var(--color-danger)',
                  }}>
                    {tx.type === 'BUY' ? '📈 AL' : '📉 SAT'}
                  </span>
                </td>
                <td style={{ padding: '14px 16px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                  {tx.fromCurrency}
                </td>
                <td style={{ padding: '14px 16px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                  {tx.toCurrency}
                </td>
                <td style={{ padding: '14px 16px', color: 'var(--color-text-primary)', fontFamily: 'monospace' }}>
                  {tx.amount.toFixed(2)}
                </td>
                <td style={{ padding: '14px 16px', color: 'var(--color-text-secondary)', fontFamily: 'monospace' }}>
                  {tx.rate.toFixed(4)}
                </td>
                <td style={{
                  padding: '14px 16px',
                  fontWeight: 600,
                  fontFamily: 'monospace',
                  color: tx.type === 'BUY' ? 'var(--color-success)' : 'var(--color-danger)',
                }}>
                  {tx.total.toFixed(4)} {tx.toCurrency}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
