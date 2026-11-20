'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';
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
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [applications, setApplications] = useState<Application[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    motivation: '',
  });

  useEffect(() => {
    loadApplications();
  }, []);

  const loadApplications = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();

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

  const handleSubmitApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError('Not authenticated');
        return;
      }

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

      // Create application
      const createResponse = await fetch(`${apiUrl}/api/v1/applications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          personal_information: {},
          motivation: formData.motivation,
        }),
      });

      if (!createResponse.ok) {
        const errorData = await createResponse.json();
        throw new Error(errorData.detail || 'Failed to create application');
      }

      const application = await createResponse.json();

      // Submit application
      const submitResponse = await fetch(
        `${apiUrl}/api/v1/applications/${application.id}/submit`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        }
      );

      if (!submitResponse.ok) {
        throw new Error('Failed to submit application');
      }

      // Reload applications
      await loadApplications();
      setShowForm(false);
      setFormData({ motivation: '' });
    } catch (err: any) {
      setError(err.message || 'Failed to submit application');
    } finally {
      setSubmitting(false);
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

  if (applications.length === 0 && !showForm) {
    return (
      <>
        <h2>Application Status</h2>
        <div className="card">
          <h3>No application found</h3>
          <p>You haven't submitted an application yet. Start your application to join the School of Discipleship.</p>
          <button onClick={() => setShowForm(true)} className="btn">
            Start Application
          </button>
        </div>
      </>
    );
  }

  if (showForm) {
    return (
      <>
        <h2>New Application</h2>
        {error && (
          <div className="card" style={{ background: '#fee', borderColor: '#fcc' }}>
            <p style={{ color: '#c00', margin: 0 }}>{error}</p>
          </div>
        )}
        <form onSubmit={handleSubmitApplication}>
          <div className="card">
            <h3>Why do you want to join the School of Discipleship?</h3>
            <label>
              Share your motivation and what you hope to learn:
            </label>
            <textarea
              value={formData.motivation}
              onChange={(e) => setFormData({ ...formData, motivation: e.target.value })}
              required
              rows={8}
              placeholder="Tell us about your journey and why you want to join..."
              style={{
                width: '100%',
                padding: '12px',
                border: '1.5px solid var(--line)',
                borderRadius: '10px',
                fontFamily: 'inherit',
                fontSize: '15px',
              }}
            />
            <div style={{ marginTop: '16px', display: 'flex', gap: '12px' }}>
              <button
                type="submit"
                disabled={submitting || !formData.motivation}
                className="btn"
              >
                {submitting ? 'Submitting...' : 'Submit Application'}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="btn ghost"
                disabled={submitting}
              >
                Cancel
              </button>
            </div>
          </div>
        </form>
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
