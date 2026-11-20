/**
 * Next.js Middleware for route protection
 * Handles authentication before routes are rendered
 */

import { type NextRequest, NextResponse } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const path = request.nextUrl.pathname

  console.log('=== MIDDLEWARE ===', {
    path,
    hasUser: !!user,
    userId: user?.id,
  })

  // Define route protections
  const isAuthRoute = path.startsWith('/login') || path.startsWith('/signup') || path.startsWith('/forgot-password')
  const isStudentRoute = path.startsWith('/student')
  const isAdminRoute = path.startsWith('/admin')
  const isProtectedRoute = isStudentRoute || isAdminRoute

  // Redirect authenticated users away from auth pages
  if (isAuthRoute && user) {
    console.log('Auth route with user, checking role...')
    
    // Check user role to redirect to appropriate dashboard
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.error('Profile fetch error:', profileError)
      // If we can't fetch profile, sign out and stay on auth page
      await supabase.auth.signOut()
      return response
    }

    console.log('Profile role:', profile?.role)

    if (profile && profile.role === 'admin') {
      console.log('Redirecting admin to /admin')
      return NextResponse.redirect(new URL('/admin', request.url))
    }
    
    console.log('Redirecting student to /student')
    return NextResponse.redirect(new URL('/student', request.url))
  }

  // Redirect unauthenticated users to login
  if (isProtectedRoute && !user) {
    const redirectUrl = new URL('/login', request.url)
    redirectUrl.searchParams.set('redirect', path)
    return NextResponse.redirect(redirectUrl)
  }

  // Check roles for protected routes
  if ((isStudentRoute || isAdminRoute) && user) {
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.error('Profile fetch error on protected route:', profileError)
      // Can't fetch profile - sign out and redirect to login
      await supabase.auth.signOut()
      return NextResponse.redirect(new URL('/login', request.url))
    }

    if (!profile || !profile.role) {
      // No profile or role - sign out and redirect to login
      await supabase.auth.signOut()
      return NextResponse.redirect(new URL('/login', request.url))
    }

    // Check admin role for admin routes
    if (isAdminRoute && profile.role !== 'admin') {
      // Not an admin - redirect to student dashboard
      return NextResponse.redirect(new URL('/student', request.url))
    }

    // Check student/admin role for student routes
    if (isStudentRoute && profile.role !== 'student' && profile.role !== 'admin') {
      // Invalid role - sign out and redirect
      await supabase.auth.signOut()
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public directory)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
