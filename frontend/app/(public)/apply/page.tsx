'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

interface Branch {
  id: string;
  name: string;
  location: string;
}

export default function ApplyPage() {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const [loading, setLoading] = useState(false);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    branch_id: '',
    church_name: '',
    year_joined: '',
    salvation_testimony: '',
    previous_education: '',
    motivation: '',
  });

  useEffect(() => {
    fetchBranches();
  }, []);

  const fetchBranches = async () => {
    try {
      const { data, error } = await supabase
        .from('branches')
        .select('id, name, location')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setBranches(data || []);
    } catch (err) {
      console.error('Error fetching branches:', err);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Check if user is authenticated
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        // Redirect to signup with return URL
        router.push(`/signup?returnUrl=/apply`);
        return;
      }

      // Submit application to backend API
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const response = await fetch(`${apiUrl}/api/v1/applications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          branch_id: formData.branch_id || null,
          personal_information: {
            first_name: formData.first_name,
            last_name: formData.last_name,
            email: formData.email,
            phone: formData.phone,
            church_name: formData.church_name,
            year_joined: formData.year_joined,
            previous_education: formData.previous_education,
            salvation_testimony: formData.salvation_testimony,
          },
          motivation: formData.motivation,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to submit application');
      }

      const result = await response.json();

      // Redirect to success page or dashboard
      router.push(`/student/application/${result.id}`);
    } catch (err: any) {
      setError(err.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="wrap" style={{ maxWidth: '640px' }}>
      <h1>Enroll</h1>
      <p>Tell us about yourself to begin your discipleship journey.</p>

      {error && (
        <div
          className="card"
          style={{
            marginBottom: '16px',
            borderColor: '#fca5a5',
            background: '#fef2f2',
          }}
        >
          <p style={{ color: '#991b1b', margin: 0 }}>{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="card">
          <div className="row">
            <div>
              <label>First name</label>
              <input
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <label>Last name</label>
              <input
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <label>Email</label>
          <input
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            required
          />

          <label>Phone number</label>
          <input
            name="phone"
            type="tel"
            placeholder="+234"
            value={formData.phone}
            onChange={handleChange}
            required
          />

          <div className="row">
            <div>
              <label>Church branch</label>
              <select
                name="branch_id"
                value={formData.branch_id}
                onChange={handleChange}
              >
                <option value="">Select branch (optional)</option>
                {branches.map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.name}
                    {branch.location ? ` - ${branch.location}` : ''}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label>Church name</label>
              <input
                name="church_name"
                value={formData.church_name}
                onChange={handleChange}
                placeholder="Your church name"
              />
            </div>
          </div>

          <div className="row">
            <div>
              <label>Year joined church</label>
              <input
                name="year_joined"
                type="number"
                placeholder="2024"
                value={formData.year_joined}
                onChange={handleChange}
                min="1900"
                max={new Date().getFullYear()}
              />
            </div>
            <div>
              <label>Previous education</label>
              <input
                name="previous_education"
                value={formData.previous_education}
                onChange={handleChange}
                placeholder="e.g., Foundational class"
              />
            </div>
          </div>

          <label>Brief salvation testimony</label>
          <textarea
            name="salvation_testimony"
            rows={4}
            value={formData.salvation_testimony}
            onChange={handleChange}
            placeholder="Share your testimony..."
            required
          />

          <label>Why do you want to join this school?</label>
          <textarea
            name="motivation"
            rows={3}
            value={formData.motivation}
            onChange={handleChange}
            placeholder="Your motivation..."
            required
          />

          <button
            type="submit"
            className="btn blk"
            style={{ marginTop: '14px' }}
            disabled={loading}
          >
            {loading ? 'Submitting...' : 'Submit application'}
          </button>
        </div>
      </form>
    </div>
  );
}
