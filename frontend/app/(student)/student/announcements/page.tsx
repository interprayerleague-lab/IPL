'use client';

import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

interface Announcement {
  id: string;
  title: string;
  body: string;
  published_at: string;
  target_type: string;
}

export default function AnnouncementsPage() {
  const supabase = createClientComponentClient();
  const [loading, setLoading] = useState(true);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  useEffect(() => {
    loadAnnouncements();
  }, []);

  const loadAnnouncements = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) return;

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

      const response = await fetch(`${apiUrl}/api/v1/announcements?limit=50`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setAnnouncements(data);
      }
    } catch (error) {
      console.error('Error loading announcements:', error);
    } finally {
      setLoading(false);
    }
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
      <h2>Ministry Announcements</h2>

      {announcements.length === 0 ? (
        <div className="card">
          <p>No announcements at this time.</p>
        </div>
      ) : (
        announcements.map((announcement) => (
          <div key={announcement.id} className="card" style={{ marginBottom: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <b>{announcement.title}</b>
              <span style={{ fontSize: '13px', color: 'var(--muted)' }}>
                {new Date(announcement.published_at).toLocaleDateString()}
              </span>
            </div>
            <p style={{ whiteSpace: 'pre-wrap' }}>{announcement.body}</p>
          </div>
        ))
      )}
    </>
  );
}
