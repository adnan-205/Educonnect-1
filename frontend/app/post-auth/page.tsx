"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useUser } from "@clerk/nextjs"
import { api } from "@/services/api"

export default function PostAuthPage() {
  const router = useRouter()
  const { isLoaded, isSignedIn, user } = useUser()

  useEffect(() => {
    const go = async () => {
      if (!isLoaded) return
      if (!isSignedIn) {
        router.replace("/sign-in")
        return
      }
      try {
        // Providers already synced backend user/JWT, just read from localStorage
        const backendUserStr = localStorage.getItem("user")
        const backendUser = backendUserStr ? JSON.parse(backendUserStr) : null
        const role = backendUser?.role || localStorage.getItem("role")
        
        // Determine if onboarding is needed
        const isOnboarded = backendUser?.isOnboarded === true
        const needsOnboarding = !isOnboarded && !role

        if (needsOnboarding) {
          router.replace("/onboarding")
          return
        }
        router.replace("/dashboard")
      } catch (e) {
        router.replace("/onboarding")
      }
    }
    go()
  }, [isLoaded, isSignedIn, user?.id, router])

  return (
    <div className="flex min-h-[50vh] items-center justify-center text-center p-6">
      <div>
        <div className="text-xl font-semibold">Login Successful! Welcome back</div>
        <div className="text-sm text-muted-foreground mt-2">User successfully logged in with Google OAuth</div>
      </div>
    </div>
  )
}
