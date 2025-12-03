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
        // Ensure backend user and JWT are ready
        const email = user?.primaryEmailAddress?.emailAddress
        const name = user?.fullName || undefined
        if (email) {
          const res = await api.post("/auth/clerk-sync", { email, name })
          const { token, user: backendUser } = res.data
          localStorage.setItem("token", token)
          localStorage.setItem("user", JSON.stringify(backendUser))
          if (backendUser?.role) {
            localStorage.setItem("role", backendUser.role)
          }
          // Determine if onboarding is needed
          // Only show onboarding if user hasn't completed it yet (isOnboarded is explicitly false or undefined)
          // If isOnboarded is true, skip onboarding even if other fields are missing (they can be updated later)
          const isOnboarded = backendUser?.isOnboarded === true
          const role = backendUser?.role || localStorage.getItem("role")

          // Only require onboarding if:
          // 1. User hasn't been onboarded yet (isOnboarded is not true)
          // 2. AND user is missing critical info (no role)
          // Note: name can be updated later, so we don't require it for skipping onboarding
          const needsOnboarding = !isOnboarded && !role

          if (needsOnboarding) {
            router.replace("/onboarding")
            return
          }
          router.replace("/dashboard")
        } else {
          router.replace("/onboarding")
        }
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
