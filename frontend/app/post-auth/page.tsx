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
          const role = backendUser?.role || localStorage.getItem("role")
          const needsOnboarding = !backendUser?.name || !role || backendUser?.isOnboarded !== true
          if (needsOnboarding) {
            router.replace("/onboarding")
            return
          }
          router.replace("/dashboard-2")
        } else {
          router.replace("/role-selection")
        }
      } catch (e) {
        router.replace("/role-selection")
      }
    }
    go()
  }, [isLoaded, isSignedIn, user?.id, router])

  return null
}
