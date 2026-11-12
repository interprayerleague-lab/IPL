'use client';

import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function EnrollmentsPage() {
  const supabase = createClientComponentClient();
  const [loading, setLoading] = useState(true);
  const [enrollments, setEnrollments] = useState<any[]>([]);

  useEffect(() => {
    loadEnrollments();
  }, []);

  const loadEnrollments = async () => {
    try:
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) return;

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

      const response = await fetch(`${apiUrl}/api/v1/admin/enrollments`, {
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
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div><p>Loading...</p></div>;
  }

  return (
    <>
      <h2>Enrollments</h2>
      <p>Manage student enrollments and cohorts.</p>

      <div className="card tw">
        <table>
          <thead>
            <tr>
              <th>Student</th>
              <th>Programme</th>
              <th>Cohort</th>
              <th>Status</th>
              <th>Enrolled</th>
            </tr>
          </thead>
          <tbody>
            {enrollments.map((enrollment) => (
              <tr key={enrollment.id}>
                <td>
                  <b>
                    {enrollment.profiles?.first_name} {enrollment.profiles?.last_name}
                  </b>
                  <br />
                  {enrollment.profiles?.email}
                </td>
                <td>{enrollment.programmes?.title || 'N/A'}</td>
                <td>{enrollment.cohorts?.name || 'No cohort'}</td>
                <td>
                  <span className={enrollment.status === 'active' ? 'tag ok' : 'tag'}>
                    {enrollment.status}
                  </span>
                </td>
                <td>
                  {enrollment.enrolled_at
                    ? new Date(enrollment.enrolled_at).toLocaleDateString()
                    : 'Not enrolled'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
