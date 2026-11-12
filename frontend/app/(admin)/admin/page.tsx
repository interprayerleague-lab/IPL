'use client';

import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import ProgressBar from '@/components/student/ProgressBar';

interface DashboardStats {
  enrolled_students: number;
  pending_applications: number;
  total_revenue_minor: number;
  pending_payments: number;
  average_completion_percentage: number;
}

export default function AdminDashboard() {
  const supabase = createClientComponentClient();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) return;

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

      const response = await fetch(`${apiUrl}/api/v1/admin/dashboard/stats`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amountMinor: number) => {
    return `₦${(amountMinor / 100).toLocaleString()}`;
  };

  if (loading) {
    return <div><p>Loading...</p></div>;
  }

  if (!stats) {
    return <div><p>Failed to load dashboard stats</p></div>;
  }

  return (
    <>
      <h2>Overview</h2>
      <p>School of Discipleship, current cohort.</p>

      <div className="grid">
        <div className="card">
          <p className="stat">{stats.enrolled_students}</p>
          <p>Enrolled students</p>
        </div>
        <div className="card">
          <p className="stat">{stats.average_completion_percentage}%</p>
          <p>Average completion</p>
        </div>
        <div className="card">
          <p className="stat">{formatCurrency(stats.total_revenue_minor)}</p>
          <p>Total revenue</p>
        </div>
        <div className="card">
          <p className="stat">{stats.pending_payments}</p>
          <p>Pending payments</p>
        </div>
      </div>

      <div className="card" style={{ marginTop: '24px' }}>
        <h3>Quick actions</h3>
        <p>
          <a href="/admin/applications" style={{ color: 'var(--primary)' }}>
            {stats.pending_applications} pending applications
          </a>{' '}
          • Review and approve student applications
        </p>
        <p>
          <a href="/admin/content" style={{ color: 'var(--primary)' }}>
            Manage content
          </a>{' '}
          • Create and edit programmes, modules, and lessons
        </p>
        <p>
          <a href="/admin/announcements" style={{ color: 'var(--primary)' }}>
            Send announcement
          </a>{' '}
          • Communicate with students
        </p>
      </div>
    </>
  );
}
