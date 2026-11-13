'use client';

import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

interface Payment {
  id: string;
  amount_minor: number;
  currency: string;
  status: string;
  provider_reference: string;
  created_at: string;
  paid_at: string | null;
  programme_title: string;
}

interface Enrollment {
  id: string;
  programme_title: string;
  payment_required: boolean;
  payment_amount_minor: number;
  payment_currency: string;
  has_payment: boolean;
  is_scholarship: boolean;
}

export default function PaymentsPage() {
  const supabase = createClientComponentClient();
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [initializing, setInitializing] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    await Promise.all([loadPayments(), loadEnrollments()]);
    setLoading(false);
  };

  const loadPayments = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) return;

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

      const response = await fetch(`${apiUrl}/api/v1/payments`, {
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
    }
  };

  const loadEnrollments = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) return;

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

      const response = await fetch(`${apiUrl}/api/v1/enrollments`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setEnrollments(data);
      }
    } catch (error) {
      console.error('Error loading enrollments:', error);
    }
  };

  const handlePayNow = async (enrollment: Enrollment) => {
    setInitializing(enrollment.id);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) return;

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

      const response = await fetch(`${apiUrl}/api/v1/payments/initialize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          enrollment_id: enrollment.id,
          amount_minor: enrollment.payment_amount_minor,
          currency: enrollment.payment_currency,
          callback_url: `${window.location.origin}/student/payments`,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        // Redirect to Paystack
        window.location.href = data.authorization_url;
      } else {
        const error = await response.json();
        alert(error.detail || 'Failed to initialize payment');
      }
    } catch (error) {
      alert('Error initializing payment');
      console.error(error);
    } finally {
      setInitializing(null);
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
    const styles: { [key: string]: React.CSSProperties } = {
      pending: { background: 'var(--warning)', color: 'white' },
      successful: { background: 'var(--success)', color: 'white' },
      failed: { background: 'var(--error)', color: 'white' },
      cancelled: { background: 'var(--muted)', color: 'white' },
    };

    const labels: { [key: string]: string } = {
      pending: '⏳ Pending',
      successful: '✓ Paid',
      failed: '✗ Failed',
      cancelled: 'Cancelled',
    };

    return (
      <span
        style={{
          padding: '4px 12px',
          borderRadius: '12px',
          fontSize: '13px',
          ...(styles[status] || {}),
        }}
      >
        {labels[status] || status}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="wrap">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <>
      <h2>Payments</h2>

      {/* Pending Payments Section */}
      {enrollments.filter((e) => e.payment_required && !e.has_payment && !e.is_scholarship).length >
        0 && (
        <div className="card" style={{ marginBottom: '24px', backgroundColor: 'var(--bg-light)' }}>
          <h3>Pending Payments</h3>
          <p style={{ marginBottom: '16px', color: 'var(--muted)' }}>
            Complete payment to access your enrolled programmes.
          </p>

          {enrollments
            .filter((e) => e.payment_required && !e.has_payment && !e.is_scholarship)
            .map((enrollment) => (
              <div
                key={enrollment.id}
                style={{
                  padding: '16px',
                  marginBottom: '12px',
                  border: '1px solid var(--border)',
                  borderRadius: '6px',
                  backgroundColor: 'white',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <b>{enrollment.programme_title}</b>
                    <p style={{ margin: '4px 0', fontSize: '18px', color: 'var(--primary)' }}>
                      {formatAmount(enrollment.payment_amount_minor, enrollment.payment_currency)}
                    </p>
                  </div>
                  <button
                    className="btn-primary"
                    onClick={() => handlePayNow(enrollment)}
                    disabled={initializing === enrollment.id}
                    style={{ fontSize: '14px', padding: '8px 24px' }}
                  >
                    {initializing === enrollment.id ? 'Processing...' : 'Pay Now'}
                  </button>
                </div>
              </div>
            ))}
        </div>
      )}

      {/* Payment History */}
      <h3 style={{ marginTop: '24px' }}>Payment History</h3>

      {payments.length === 0 ? (
        <div className="card">
          <p>No payment records yet.</p>
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
                  marginBottom: '8px',
                }}
              >
                <div style={{ flex: 1 }}>
                  <b>{payment.programme_title}</b>
                  <p style={{ margin: '4px 0', fontSize: '16px', color: 'var(--primary)' }}>
                    {formatAmount(payment.amount_minor, payment.currency)}
                  </p>
                  <p style={{ margin: '4px 0', fontSize: '13px', color: 'var(--muted)' }}>
                    Reference: {payment.provider_reference}
                  </p>
                  <p style={{ margin: '4px 0', fontSize: '13px', color: 'var(--muted)' }}>
                    {new Date(payment.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
                <div>{getStatusBadge(payment.status)}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
