"use client"

import { useEffect } from "react"
import { ThemeProvider } from "@/components/theme-provider"
import { useUser, useAuth } from "@clerk/nextjs"
import { api, setAuthTokenProvider } from "@/services/api"
import { toast } from "@/components/ui/use-toast"

export function Providers({ children }: { children: React.ReactNode }) {
  const { isSignedIn, isLoaded, user } = useUser()
  const { getToken } = useAuth()

  // Set up Clerk token provider for API calls
  useEffect(() => {
    if (getToken) {
      setAuthTokenProvider(async () => {
        try {
          // Get token from Clerk
          const token = await getToken()
          return token
        } catch (error) {
          console.error('Error getting Clerk token:', error)
          // Fallback to localStorage token
          return typeof window !== 'undefined' ? localStorage.getItem('token') : null
        }
      })
    }
  }, [getToken])

  useEffect(() => {
    const syncBackendToken = async () => {
      try {
        // Wait until Clerk has loaded to avoid clearing role during hydration
        if (!isLoaded) return

        if (isSignedIn && user?.primaryEmailAddress?.emailAddress) {
          const email = user.primaryEmailAddress.emailAddress
          const name = user.fullName || undefined
          // Save email early so 401 interceptor can recover immediately
          try { localStorage.setItem('userEmail', email) } catch {}
          const res = await api.post('/auth/clerk-sync', { email, name })
          const { token, user: backendUser } = res.data
          localStorage.setItem('token', token)
          localStorage.setItem('user', JSON.stringify(backendUser))
          // ensure email persists
          try { localStorage.setItem('userEmail', email) } catch {}
          // Preserve existing role if backend does not return one yet
          const existingRole = typeof window !== 'undefined' ? localStorage.getItem('role') : null
          if (backendUser?.role) {
            localStorage.setItem('role', backendUser.role)
          } else if (!existingRole) {
            // do not overwrite if already set; otherwise leave empty to trigger role-selection
          }
        } else if (isLoaded && !isSignedIn) {
          // Clear only when we know user is signed out
          localStorage.removeItem('token')
          localStorage.removeItem('user')
          localStorage.removeItem('role')
        }
      } catch (err) {
        // Fallback: ensure no stale tokens
        localStorage.removeItem('token')
      }
    }

    // Run on mount and when auth state changes
    syncBackendToken()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, isSignedIn, user?.id])

  // Global network error handler -> show retry toast
  useEffect(() => {
    const onNetErr = (e: Event) => {
      try {
        const detail = (e as CustomEvent).detail as { url?: string; method?: string } | undefined
        const where = detail?.url ? `${detail.method?.toUpperCase?.() || 'REQ'} ${detail.url}` : 'request'
        toast({
          title: 'Network error',
          description: `We could not reach the server for this ${where}. Please check your connection and try again.`,
        })
      } catch {
        toast({ title: 'Network error', description: 'Please check your connection and try again.' })
      }
    }
    if (typeof window !== 'undefined') {
      window.addEventListener('educonnect:network-error', onNetErr as EventListener)
      return () => window.removeEventListener('educonnect:network-error', onNetErr as EventListener)
    }
  }, [])

  return (
    <ThemeProvider 
      attribute="class" 
      defaultTheme="light" 
      enableSystem 
      disableTransitionOnChange
    >
      {children}
    </ThemeProvider>
  )
}
