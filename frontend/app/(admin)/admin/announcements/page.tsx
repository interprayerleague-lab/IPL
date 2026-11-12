'use client';

import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function AnnouncementsPage() {
  const supabase = createClientComponentClient();
  const [loading, setLoading] = useState(true);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [creating, setCreating] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    body: '',
    target_type: 'all',
    is_published: false,
  });

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

      const response = await fetch(`${apiUrl}/api/v1/admin/announcements`, {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) return;

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

      const response = await fetch(`${apiUrl}/api/v1/admin/announcements`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setFormData({ title: '', body: '', target_type: 'all', is_published: false });
        await loadAnnouncements();
      } else {
        alert('Failed to create announcement');
      }
    } catch (error) {
      alert('Error creating announcement');
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return <div><p>Loading...</p></div>;
  }

  return (
    <>
      <h2>Announcements</h2>

      <form onSubmit={handleSubmit}>
        <div className="card">
          <label>Title</label>
          <input
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
          />

          <label>Message</label>
          <textarea
            rows={3}
            value={formData.body}
            onChange={(e) => setFormData({ ...formData, body: e.target.value })}
            required
          />

          <div className="row">
            <div>
              <label>Send to</label>
              <select
                value={formData.target_type}
                onChange={(e) => setFormData({ ...formData, target_type: e.target.value })}
              >
                <option value="all">All students</option>
                <option value="programme">Specific programme</option>
                <option value="cohort">Specific cohort</option>
              </select>
            </div>
            <div>
              <label>Status</label>
              <select
                value={formData.is_published ? 'published' : 'draft'}
                onChange={(e) =>
                  setFormData({ ...formData, is_published: e.target.value === 'published' })
                }
              >
                <option value="draft">Save as draft</option>
                <option value="published">Publish now</option>
              </select>
            </div>
          </div>

          <button type="submit" className="btn" style={{ marginTop: '10px' }} disabled={creating}>
            {creating ? 'Creating...' : 'Create announcement'}
          </button>
        </div>
      </form>

      <h3 style={{ marginTop: '24px' }}>Sent Announcements</h3>
      {announcements.length === 0 ? (
        <div className="card">
          <p>No announcements yet</p>
        </div>
      ) : (
        announcements.map((announcement) => (
          <div key={announcement.id} className="card" style={{ marginBottom: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <b>{announcement.title}</b>
              <span className={announcement.is_published ? 'tag ok' : 'tag warn'}>
                {announcement.is_published ? 'Published' : 'Draft'}
              </span>
            </div>
            <p>{announcement.body}</p>
            <p style={{ fontSize: '13px', color: 'var(--muted)', margin: 0 }}>
              Target: {announcement.target_type} •{' '}
              {announcement.published_at
                ? new Date(announcement.published_at).toLocaleDateString()
                : 'Not published'}
            </p>
          </div>
        ))
      )}
    </>
  );
}
