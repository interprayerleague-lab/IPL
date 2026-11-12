'use client';

import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

interface Application {
  id: string;
  application_number: string;
  status: string;
  student_id: string;
  personal_information: any;
  submitted_at: string;
}

export default function ApplicationsPage() {
  const supabase = createClientComponentClient();
  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState<Application[]>([]);
  const [reviewingId, setReviewingId] = useState<string | null>(null);

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

      const response = await fetch(`${apiUrl}/api/v1/applications?status=submitted`, {
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

  const handleReview = async (applicationId: string, status: string) => {
    if (!confirm(`Confirm ${status} this application?`)) return;

    setReviewingId(applicationId);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) return;

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

      const response = await fetch(
        `${apiUrl}/api/v1/admin/applications/${applicationId}/review`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            status,
            review_notes: '',
          }),
        }
      );

      if (response.ok) {
        // Reload applications
        await loadApplications();
      } else {
        alert('Failed to review application');
      }
    } catch (error) {
      alert('Error reviewing application');
    } finally {
      setReviewingId(null);
    }
  };

  if (loading) {
    return <div><p>Loading...</p></div>;
  }

  return (
    <>
      <h2>Application Pipeline</h2>
      <p>Review and approve student applications.</p>

      {applications.length === 0 ? (
        <div className="card">
          <p>No pending applications</p>
        </div>
      ) : (
        <div className="card tw">
          <table>
            <thead>
              <tr>
                <th>Application #</th>
                <th>Student</th>
                <th>Email</th>
                <th>Submitted</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {applications.map((app) => (
                <tr key={app.id}>
                  <td>
                    <b>{app.application_number}</b>
                  </td>
                  <td>
                    {app.personal_information.first_name} {app.personal_information.last_name}
                  </td>
                  <td>{app.personal_information.email}</td>
                  <td>
                    {app.submitted_at
                      ? new Date(app.submitted_at).toLocaleDateString()
                      : 'Not submitted'}
                  </td>
                  <td>
                    <button
                      className="btn ghost"
                      style={{ marginRight: '8px', fontSize: '13px', padding: '6px 12px' }}
                      onClick={() => handleReview(app.id, 'approved')}
                      disabled={reviewingId === app.id}
                    >
                      ✓ Approve
                    </button>
                    <button
                      className="btn ghost"
                      style={{ fontSize: '13px', padding: '6px 12px' }}
                      onClick={() => handleReview(app.id, 'rejected')}
                      disabled={reviewingId === app.id}
                    >
                      ✗ Reject
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
