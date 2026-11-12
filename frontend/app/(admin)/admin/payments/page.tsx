'use client';

import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

interface Payment {
  id: string;
  student_name: string;
  programme_title: string;
  amount_minor: number;
  currency: string;
  status: string;
  provider_reference: string;
  created_at: string;
  paid_at: string | null;
  verified_at: string | null;
}

export default function AdminPaymentsPage() {
  const supabase = createClientComponentClient();
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [verifying, setVerifying] = useState<string | null>(null);

  useEffect(() => {
    loadPayments();
  }, [statusFilter]);

  const loadPayments = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) return;

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const queryParams = statusFilter ? `?status=${statusFilter}` : '';

      const response = await fetch(`${apiUrl}/api/v1/admin/payments${queryParams}`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setPayments(data);
      }
    } catch (error) {
      console.error('Error loading payments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyPayment = async (paymentId: string) => {
    if (!confirm('Verify this payment with Paystack?')) return;

    setVerifying(paymentId);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) return;

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

      const response = await fetch(`${apiUrl}/api/v1/admin/payments/${paymentId}/verify`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (response.ok) {
        const result = await response.json();
        alert(result.message);
        await loadPayments();
      } else {
        const error = await response.json();
        alert(error.detail || 'Verification failed');
      }
    } catch (error) {
      alert('Error verifying payment');
      console.error(error);
    } finally {
      setVerifying(null);
    }
  };

  const formatAmount = (minorUnits: number, currency: string) => {
    const amount = minorUnits / 100;
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    const styles: { [key: string]: string } = {
      pending: 'warn',
      successful: 'ok',
      failed: 'error',
      cancelled: '',
    };

    return <span className={`tag ${styles[status] || ''}`}>{status}</span>;
  };

  if (loading) {
    return (
      <div>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <>
      <h2>Payments</h2>

      {/* Filters */}
      <div className="card" style={{ marginBottom: '16px' }}>
        <div className="row">
          <div>
            <label>Status</label>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="">All</option>
              <option value="pending">Pending</option>
              <option value="successful">Successful</option>
              <option value="failed">Failed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      {/* Payments List */}
      {payments.length === 0 ? (
        <div className="card">
          <p>No payments found.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '12px' }}>
          {payments.map((payment) => (
            <div key={payment.id} className="card">
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <b>{payment.student_name}</b>
                    {getStatusBadge(payment.status)}
                  </div>
                  <p style={{ margin: '4px 0', fontSize: '14px' }}>{payment.programme_title}</p>
                  <p style={{ margin: '4px 0', fontSize: '16px', color: 'var(--primary)' }}>
                    {formatAmount(payment.amount_minor, payment.currency)}
                  </p>
                  <p style={{ margin: '4px 0', fontSize: '13px', color: 'var(--muted)' }}>
                    Reference: {payment.provider_reference}
                  </p>
                  <p style={{ margin: '4px 0', fontSize: '13px', color: 'var(--muted)' }}>
                    Created: {new Date(payment.created_at).toLocaleDateString()}
                    {payment.paid_at &&
                      ` • Paid: ${new Date(payment.paid_at).toLocaleDateString()}`}
                  </p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {payment.status === 'pending' && (
                    <button
                      className="btn"
                      onClick={() => handleVerifyPayment(payment.id)}
                      disabled={verifying === payment.id}
                      style={{ fontSize: '14px', padding: '6px 12px' }}
                    >
                      {verifying === payment.id ? 'Verifying...' : 'Verify'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Summary */}
      <div className="card" style={{ marginTop: '24px' }}>
        <h3>Summary</h3>
        <p>
          Total payments: {payments.length} •{' '}
          Successful: {payments.filter((p) => p.status === 'successful').length} •{' '}
          Pending: {payments.filter((p) => p.status === 'pending').length}
        </p>
      </div>
    </>
  );
}
