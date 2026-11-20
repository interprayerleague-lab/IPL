/**
 * Supabase client configuration
 * School of Discipleship Frontend
 */

import { createBrowserClient } from '@supabase/ssr'

// Verify environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

/**
 * Create Supabase client for browser
 * Use this in Client Components
 */
export function createClient() {
  return createBrowserClient(supabaseUrl!, supabaseAnonKey!, {
    cookies: {
      get(name: string) {
        if (typeof document === 'undefined') return undefined
        
        const cookies = document.cookie.split(';')
        const cookie = cookies.find(c => c.trim().startsWith(`${name}=`))
        
        if (!cookie) return undefined
        
        const value = cookie.split('=').slice(1).join('=')
        return decodeURIComponent(value)
      },
      set(name: string, value: string, options: any) {
        if (typeof document === 'undefined') return
        
        let cookie = `${name}=${encodeURIComponent(value)}`
        
        if (options?.maxAge) {
          cookie += `; max-age=${options.maxAge}`
        }
        if (options?.path) {
          cookie += `; path=${options.path}`
        } else {
          cookie += '; path=/'
        }
        if (options?.domain) {
          cookie += `; domain=${options.domain}`
        }
        if (options?.sameSite) {
          cookie += `; samesite=${options.sameSite}`
        }
        if (options?.secure) {
          cookie += '; secure'
        }
        
        document.cookie = cookie
      },
      remove(name: string, options: any) {
        if (typeof document === 'undefined') return
        
        let cookie = `${name}=; max-age=0`
        
        if (options?.path) {
          cookie += `; path=${options.path}`
        } else {
          cookie += '; path=/'
        }
        if (options?.domain) {
          cookie += `; domain=${options.domain}`
        }
        
        document.cookie = cookie
      },
    },
  })
}

/**
 * Get current session
 */
export async function getSession() {
  const supabase = createClient()
  const { data: { session }, error } = await supabase.auth.getSession()
  
  if (error) {
    console.error('Error fetching session:', error)
    return null
  }
  
  return session
}

/**
 * Get current user
 */
export async function getUser() {
  const supabase = createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error) {
    console.error('Error fetching user:', error)
    return null
  }
  
  return user
}

/**
 * Sign out current user
 */
export async function signOut() {
  const supabase = createClient()
  const { error } = await supabase.auth.signOut()
  
  if (error) {
    throw error
  }
}
