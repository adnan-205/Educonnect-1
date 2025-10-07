"use client"

import { useEffect } from "react"
import { ThemeProvider } from "@/components/theme-provider"
import { useUser } from "@clerk/nextjs"
import { api } from "@/services/api"

export function Providers({ children }: { children: React.ReactNode }) {
  const { isSignedIn, isLoaded, user } = useUser()

  useEffect(() => {
    const syncBackendToken = async () => {
      try {
        // Wait until Clerk has loaded to avoid clearing role during hydration
        if (!isLoaded) return

        if (isSignedIn && user?.primaryEmailAddress?.emailAddress) {
          const email = user.primaryEmailAddress.emailAddress
          const name = user.fullName || undefined
          const res = await api.post('/auth/clerk-sync', { email, name })
          const { token, user: backendUser } = res.data
          localStorage.setItem('token', token)
          localStorage.setItem('user', JSON.stringify(backendUser))
          localStorage.setItem('userEmail', email)
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
