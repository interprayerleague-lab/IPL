'use client';

import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function ProfilePage() {
  const supabase = createClientComponentClient();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
  });
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) return;

      setUser(session.user);

      // Load profile from database
      const { data, error } = await supabase
        .from('profiles')
        .select('first_name, last_name, email, phone')
        .eq('id', session.user.id)
        .single();

      if (data) {
        setProfile({
          first_name: data.first_name || '',
          last_name: data.last_name || '',
          email: data.email || session.user.email || '',
          phone: data.phone || '',
        });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) return;

      const { error } = await supabase
        .from('profiles')
        .update({
          first_name: profile.first_name,
          last_name: profile.last_name,
          phone: profile.phone,
          updated_at: new Date().toISOString(),
        })
        .eq('id', session.user.id);

      if (error) throw error;

      setMessage('Profile updated successfully!');
    } catch (error) {
      setMessage('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProfile({
      ...profile,
      [e.target.name]: e.target.value,
    });
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
      <h2>Profile and Settings</h2>

      {message && (
        <div
          className="card"
          style={{
            marginBottom: '16px',
            background: message.includes('success') ? '#dcfce7' : '#fef2f2',
            borderColor: message.includes('success') ? '#16a34a' : '#fca5a5',
          }}
        >
          <p
            style={{
              color: message.includes('success') ? '#166534' : '#991b1b',
              margin: 0,
            }}
          >
            {message}
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="card">
          <div className="ico" style={{ width: '80px', height: '80px', borderRadius: '50%', fontSize: '32px', marginBottom: '12px' }}>
            👤
          </div>

          <label>First name</label>
          <input
            name="first_name"
            value={profile.first_name}
            onChange={handleChange}
            required
          />

          <label>Last name</label>
          <input
            name="last_name"
            value={profile.last_name}
            onChange={handleChange}
            required
          />

          <label>Email</label>
          <input
            name="email"
            type="email"
            value={profile.email}
            disabled
            style={{ background: 'var(--line)', cursor: 'not-allowed' }}
          />
          <p style={{ fontSize: '13px', marginTop: '4px' }}>
            Email cannot be changed
          </p>

          <label>Phone number</label>
          <input
            name="phone"
            type="tel"
            value={profile.phone}
            onChange={handleChange}
          />

          <button
            type="submit"
            className="btn blk"
            style={{ marginTop: '14px' }}
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save changes'}
          </button>
        </div>
      </form>
    </>
  );
}
