'use client'

/**
 * Forgot Password Page
 * Request password reset email
 */

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'

export const dynamic = 'force-dynamic';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })

      if (error) throw error

      setSuccess(true)
    } catch (err: any) {
      setError(err.message || 'Failed to send reset email')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--hero)' }}>
      <div className="w-full max-w-[400px] bg-[var(--card)] rounded-[14px] p-[26px] shadow-lg">
        <h2 className="text-[24px] font-bold mb-2">Reset password</h2>
        <p className="text-[var(--muted)] mb-6">
          {success 
            ? 'Check your email for the reset link.' 
            : 'We will email you a reset link.'}
        </p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-[10px] mb-4">
            {error}
          </div>
        )}

        {success ? (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-[10px] mb-4">
            Password reset email sent! Check your inbox and spam folder.
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <label className="block font-semibold text-[13px] mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-[12px] py-[11px] border-[1.5px] border-[var(--line)] rounded-[10px] bg-[var(--card)] text-[var(--ink)] mb-4"
              placeholder="student@example.com"
            />

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[var(--primary)] text-white font-semibold py-[11px] px-5 rounded-[10px] hover:bg-[var(--primary-dark)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Sending...' : 'Send reset link'}
            </button>
          </form>
        )}

        <p className="text-center text-[var(--muted)] text-[15px] mt-4">
          <Link href="/login" className="text-[var(--primary)] hover:underline">
            Back to log in
          </Link>
        </p>
      </div>
    </div>
  )
}
