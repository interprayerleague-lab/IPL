'use client';

import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import Link from 'next/link';

interface Application {
  id: string;
  application_number: string;
  status: string;
  personal_information: any;
  motivation: string;
  review_notes: string;
  submitted_at: string;
  reviewed_at: string;
  created_at: string;
}

export default function ApplicationPage() {
  const supabase = createClientComponentClient();
  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState<Application[]>([]);

  useEffect(() => {
    loadApplications();
  }, []);

  const loadApplications = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) return;

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

      const response = await fetch(`${apiUrl}/api/v1/applications/me`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setApplications(data);
      }
    } catch (error) {
      console.error('Error loading applications:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: { [key: string]: string } = {
      draft: 'tag',
      submitted: 'tag',
      under_review: 'tag',
      additional_information_required: 'tag warn',
      approved: 'tag ok',
      rejected: 'tag warn',
      withdrawn: 'tag',
    };

    const labelMap: { [key: string]: string } = {
      draft: 'Draft',
      submitted: 'Submitted',
      under_review: 'Under Review',
      additional_information_required: 'Info Required',
      approved: 'Approved',
      rejected: 'Rejected',
      withdrawn: 'Withdrawn',
    };

    return (
      <span className={statusMap[status] || 'tag'}>
        {labelMap[status] || status}
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

  if (applications.length === 0) {
    return (
      <>
        <h2>Application Status</h2>
        <div className="card">
          <h3>No application found</h3>
          <p>You haven't submitted an application yet.</p>
          <Link href="/apply" className="btn">
            Start application
          </Link>
        </div>
      </>
    );
  }

  const latestApplication = applications[0];

  return (
    <>
      <h2>Application Status</h2>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <div>
            <b>Application #{latestApplication.application_number}</b>
          </div>
          {getStatusBadge(latestApplication.status)}
        </div>

        <p>
          <b>Submitted:</b>{' '}
          {latestApplication.submitted_at
            ? new Date(latestApplication.submitted_at).toLocaleDateString()
            : 'Not submitted'}
        </p>

        {latestApplication.personal_information && (
          <>
            <p>
              <b>Name:</b> {latestApplication.personal_information.first_name}{' '}
              {latestApplication.personal_information.last_name}
            </p>
            <p>
              <b>Email:</b> {latestApplication.personal_information.email}
            </p>
            <p>
              <b>Phone:</b> {latestApplication.personal_information.phone}
            </p>
          </>
        )}

        {latestApplication.review_notes && (
          <div
            style={{
              marginTop: '16px',
              padding: '12px',
              background: 'var(--bg)',
              borderRadius: '8px',
            }}
          >
            <b>Admin Notes:</b>
            <p>{latestApplication.review_notes}</p>
          </div>
        )}

        {latestApplication.status === 'approved' && (
          <div
            style={{
              marginTop: '16px',
              padding: '12px',
              background: '#dcfce7',
              borderRadius: '8px',
            }}
          >
            <p style={{ color: '#166534', margin: 0 }}>
              ✓ Your application has been approved! You will be enrolled into a cohort soon.
            </p>
          </div>
        )}

        {latestApplication.status === 'additional_information_required' && (
          <div
            style={{
              marginTop: '16px',
              padding: '12px',
              background: '#fef3c7',
              borderRadius: '8px',
            }}
          >
            <p style={{ color: '#92400e', margin: 0 }}>
              Additional information is required. Please review the admin notes above.
            </p>
          </div>
        )}
      </div>

      {applications.length > 1 && (
        <>
          <h3 style={{ marginTop: '24px' }}>Previous Applications</h3>
          {applications.slice(1).map((app) => (
            <div key={app.id} className="card" style={{ marginBottom: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <b>#{app.application_number}</b>
                {getStatusBadge(app.status)}
              </div>
              <p style={{ fontSize: '13px', margin: '4px 0 0' }}>
                Created: {new Date(app.created_at).toLocaleDateString()}
              </p>
            </div>
          ))}
        </>
      )}
    </>
  );
}
