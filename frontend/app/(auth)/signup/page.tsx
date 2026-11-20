'use client'

/**
 * Signup Page
 * User registration with email/password
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'

export const dynamic = 'force-dynamic';

export default function SignupPage() {
  const router = useRouter()

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    phone: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  const validatePassword = (password: string): string | null => {
    if (password.length < 8) {
      return 'Password must be at least 8 characters'
    }
    if (!/[A-Z]/.test(password)) {
      return 'Password must contain at least one uppercase letter'
    }
    if (!/[a-z]/.test(password)) {
      return 'Password must contain at least one lowercase letter'
    }
    if (!/[0-9]/.test(password)) {
      return 'Password must contain at least one number'
    }
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    // Validate password strength
    const passwordError = validatePassword(formData.password)
    if (passwordError) {
      setError(passwordError)
      setLoading(false)
      return
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            first_name: formData.firstName,
            last_name: formData.lastName,
            phone: formData.phone || null,
          },
        },
      })

      if (error) throw error

      if (data.user) {
        // Show success message and redirect to login
        alert('Account created successfully! You can now log in.')
        window.location.href = '/login'
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create account')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8" style={{ background: 'var(--hero)' }}>
      <div className="w-full max-w-[400px] bg-[var(--card)] rounded-[14px] p-[26px] shadow-lg">
        <h2 className="text-[24px] font-bold mb-2">Create account</h2>
        <p className="text-[var(--muted)] mb-6">Join the School of Discipleship</p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-[10px] mb-4 text-[14px]">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <label className="block font-semibold text-[13px] mb-1">First name</label>
          <input
            type="text"
            name="firstName"
            value={formData.firstName}
            onChange={handleChange}
            required
            className="w-full px-[12px] py-[11px] border-[1.5px] border-[var(--line)] rounded-[10px] bg-[var(--card)] text-[var(--ink)] mb-3"
            placeholder="John"
          />

          <label className="block font-semibold text-[13px] mb-1">Last name</label>
          <input
            type="text"
            name="lastName"
            value={formData.lastName}
            onChange={handleChange}
            required
            className="w-full px-[12px] py-[11px] border-[1.5px] border-[var(--line)] rounded-[10px] bg-[var(--card)] text-[var(--ink)] mb-3"
            placeholder="Doe"
          />

          <label className="block font-semibold text-[13px] mb-1">Email</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            className="w-full px-[12px] py-[11px] border-[1.5px] border-[var(--line)] rounded-[10px] bg-[var(--card)] text-[var(--ink)] mb-3"
            placeholder="student@example.com"
          />

          <label className="block font-semibold text-[13px] mb-1">Phone (optional)</label>
          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            className="w-full px-[12px] py-[11px] border-[1.5px] border-[var(--line)] rounded-[10px] bg-[var(--card)] text-[var(--ink)] mb-3"
            placeholder="+234 800 000 0000"
          />

          <label className="block font-semibold text-[13px] mb-1">Password</label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
            minLength={8}
            className="w-full px-[12px] py-[11px] border-[1.5px] border-[var(--line)] rounded-[10px] bg-[var(--card)] text-[var(--ink)] mb-3"
            placeholder="••••••••"
          />

          <label className="block font-semibold text-[13px] mb-1">Confirm password</label>
          <input
            type="password"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            required
            minLength={8}
            className="w-full px-[12px] py-[11px] border-[1.5px] border-[var(--line)] rounded-[10px] bg-[var(--card)] text-[var(--ink)] mb-4"
            placeholder="••••••••"
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[var(--primary)] text-white font-semibold py-[11px] px-5 rounded-[10px] hover:bg-[var(--primary-dark)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Creating account...' : 'Create account'}
          </button>
        </form>

        <p className="text-center text-[var(--muted)] text-[15px] mt-4">
          Already have an account?{' '}
          <Link href="/login" className="text-[var(--primary)] font-semibold hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  )
}
