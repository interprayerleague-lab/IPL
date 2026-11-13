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
        alert('Account created successfully! Please check your email to verify your account.')
        router.push('/login')
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create account')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignup = async () => {
    setLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback?redirect=/student/dashboard`,
        },
      })

      if (error) throw error
    } catch (err: any) {
      setError(err.message || 'Failed to sign up with Google')
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

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[var(--line)]"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-[var(--card)] text-[var(--muted)]">Or continue with</span>
          </div>
        </div>

        <button
          onClick={handleGoogleSignup}
          disabled={loading}
          className="w-full bg-white border-[1.5px] border-[var(--line)] text-[var(--ink)] font-semibold py-[11px] px-5 rounded-[10px] hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continue with Google
        </button>

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
