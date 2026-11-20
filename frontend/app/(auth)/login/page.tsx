'use client'

/**
 * Login Page
 * Email/password authentication
 */

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'

export const dynamic = 'force-dynamic';

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirect') || '/student'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    console.log('=== LOGIN ATTEMPT START ===')
    console.log('Email:', email)
    console.log('Redirect target:', redirectTo)

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      console.log('=== SUPABASE RESPONSE ===')
      console.log('Has data:', !!data)
      console.log('Has session:', !!data?.session)
      console.log('Has user:', !!data?.user)
      console.log('Error:', error)

      if (error) {
        console.error('Login failed with error:', error)
        throw error
      }

      if (data.session) {
        console.log('=== LOGIN SUCCESS ===')
        console.log('Session exists, user ID:', data.user?.id)
        console.log('Attempting redirect to:', redirectTo)
        
        // Add a small delay to ensure session is saved
        await new Promise(resolve => setTimeout(resolve, 500))
        
        console.log('Executing redirect now...')
        window.location.href = redirectTo
      } else {
        console.error('No session returned even though no error')
        setError('Login failed: No session created')
      }
    } catch (err: any) {
      console.error('=== LOGIN ERROR ===', err)
      setError(err.message || 'Invalid email or password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--hero)' }}>
      <div className="w-full max-w-[400px] bg-[var(--card)] rounded-[14px] p-[26px] shadow-lg">
        <h2 className="text-[24px] font-bold mb-2">Welcome back</h2>
        <p className="text-[var(--muted)] mb-6">Log in to continue learning.</p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-[10px] mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleEmailLogin}>
          <label className="block font-semibold text-[13px] mb-1">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-[12px] py-[11px] border-[1.5px] border-[var(--line)] rounded-[10px] bg-[var(--card)] text-[var(--ink)] mb-3"
            placeholder="student@example.com"
          />

          <label className="block font-semibold text-[13px] mb-1">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full px-[12px] py-[11px] border-[1.5px] border-[var(--line)] rounded-[10px] bg-[var(--card)] text-[var(--ink)] mb-2"
            placeholder="••••••••"
          />

          <div className="text-right mb-4">
            <Link 
              href="/forgot-password" 
              className="text-[var(--primary)] text-[15px] hover:underline"
            >
              Forgot password?
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[var(--primary)] text-white font-semibold py-[11px] px-5 rounded-[10px] hover:bg-[var(--primary-dark)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Logging in...' : 'Log in'}
          </button>
        </form>

        <p className="text-center text-[var(--muted)] text-[15px] mt-4">
          New here?{' '}
          <Link href="/signup" className="text-[var(--primary)] font-semibold hover:underline">
            Create account
          </Link>
        </p>
      </div>
    </div>
  )
}
