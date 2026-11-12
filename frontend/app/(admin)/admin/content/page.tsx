'use client';

import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function ContentPage() {
  const supabase = createClientComponentClient();
  const [loading, setLoading] = useState(true);
  const [programmes, setProgrammes] = useState<any[]>([]);

  useEffect(() => {
    loadContent();
  }, []);

  const loadContent = async () => {
    try:
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) return;

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

      const response = await fetch(`${apiUrl}/api/v1/programmes`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setProgrammes(data);
      }
    } catch (error) {
      console.error('Error loading content:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div><p>Loading...</p></div>;
  }

  return (
    <>
      <h2>Content Management</h2>
      <p>Manage programmes, modules, and lessons.</p>

      <div className="card">
        <h3>Programmes</h3>
        {programmes.length === 0 ? (
          <p>No programmes found</p>
        ) : (
          <table style={{ width: '100%' }}>
            <thead>
              <tr>
                <th>Title</th>
                <th>Duration</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {programmes.map((programme) => (
                <tr key={programme.id}>
                  <td>
                    <b>{programme.title}</b>
                  </td>
                  <td>{programme.duration_weeks ? `${programme.duration_weeks} weeks` : 'N/A'}</td>
                  <td>
                    <span className={programme.is_published ? 'tag ok' : 'tag warn'}>
                      {programme.is_published ? 'Published' : 'Draft'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="card" style={{ marginTop: '16px' }}>
        <p style={{ color: 'var(--muted)', fontSize: '14px' }}>
          Full content editor (create/edit programmes, modules, lessons) will be available in the next phase.
          For now, content is managed via database or API.
        </p>
      </div>
    </>
  );
}
