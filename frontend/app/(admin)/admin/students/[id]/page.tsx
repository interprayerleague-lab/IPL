'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import Link from 'next/link';

export default function StudentDetailPage() {
  const params = useParams();
  const supabase = createClientComponentClient();
  const [loading, setLoading] = useState(true);
  const [student, setStudent] = useState<any>(null);

  useEffect(() => {
    loadStudent();
  }, [params.id]);

  const loadStudent = async () => {
    try:
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) return;

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

      const response = await fetch(`${apiUrl}/api/v1/admin/students/${params.id}`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setStudent(data);
      }
    } catch (error) {
      console.error('Error loading student:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div><p>Loading...</p></div>;
  }

  if (!student) {
    return <div><p>Student not found</p></div>;
  }

  return (
    <>
      <Link href="/admin/students" style={{ color: 'var(--primary)', marginBottom: '16px', display: 'inline-block' }}>
        ← Back to students
      </Link>

      <h2>
        {student.first_name} {student.last_name}
      </h2>

      <div className="grid">
        <div className="card">
          <h3>Contact Information</h3>
          <p>
            <b>Email:</b> {student.email}
          </p>
          <p>
            <b>Phone:</b> {student.phone || 'Not provided'}
          </p>
          <p>
            <b>Member since:</b> {new Date(student.created_at).toLocaleDateString()}
          </p>
        </div>

        <div className="card">
          <h3>Progress Summary</h3>
          <p>
            <b>Lessons completed:</b> {student.progress_summary.completed_lessons} /{' '}
            {student.progress_summary.total_lessons}
          </p>
          <p>
            <b>Overall progress:</b> {student.progress_summary.percentage}%
          </p>
        </div>
      </div>

      <h3 style={{ marginTop: '24px' }}>Enrollments</h3>
      {student.enrollments && student.enrollments.length > 0 ? (
        student.enrollments.map((enrollment: any) => (
          <div key={enrollment.id} className="card" style={{ marginBottom: '10px' }}>
            <b>{enrollment.programmes?.title || 'Programme'}</b>
            <p>
              Status: <span className="tag">{enrollment.status}</span>
              {enrollment.cohorts && <> • Cohort: {enrollment.cohorts.name}</>}
            </p>
          </div>
        ))
      ) : (
        <div className="card">
          <p>No enrollments</p>
        </div>
      )}

      <h3 style={{ marginTop: '24px' }}>Applications</h3>
      {student.applications && student.applications.length > 0 ? (
        student.applications.map((app: any) => (
          <div key={app.id} className="card" style={{ marginBottom: '10px' }}>
            <b>Application #{app.application_number}</b>
            <p>
              Status: <span className="tag">{app.status}</span> • Submitted:{' '}
              {app.submitted_at ? new Date(app.submitted_at).toLocaleDateString() : 'Not submitted'}
            </p>
          </div>
        ))
      ) : (
        <div className="card">
          <p>No applications</p>
        </div>
      )}
    </>
  );
}
