'use client';

import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import Link from 'next/link';
import ProgressBar from '@/components/student/ProgressBar';

interface Student {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  enrollment_status: string;
  programme_title: string;
  progress_percentage: number;
}

export default function StudentsPage() {
  const supabase = createClientComponentClient();
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<Student[]>([]);

  useEffect(() => {
    loadStudents();
  }, []);

  const loadStudents = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) return;

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

      const response = await fetch(`${apiUrl}/api/v1/admin/students`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setStudents(data);
      }
    } catch (error) {
      console.error('Error loading students:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div><p>Loading...</p></div>;
  }

  return (
    <>
      <h2>Students Directory</h2>

      <div className="card tw">
        <table>
          <thead>
            <tr>
              <th>Student</th>
              <th>Contact</th>
              <th>Programme</th>
              <th>Progress</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {students.map((student) => (
              <tr key={student.id}>
                <td>
                  <b>
                    {student.first_name} {student.last_name}
                  </b>
                </td>
                <td>
                  {student.email}
                  <br />
                  {student.phone}
                </td>
                <td>{student.programme_title || 'Not enrolled'}</td>
                <td>
                  <div className="bar mini">
                    <i style={{ width: `${student.progress_percentage}%` }}></i>
                  </div>{' '}
                  {student.progress_percentage}%
                </td>
                <td>
                  {student.enrollment_status ? (
                    <span className={student.enrollment_status === 'active' ? 'tag' : 'tag warn'}>
                      {student.enrollment_status}
                    </span>
                  ) : (
                    <span className="tag warn">No enrollment</span>
                  )}
                </td>
                <td>
                  <Link href={`/admin/students/${student.id}`} className="btn ghost">
                    View
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
