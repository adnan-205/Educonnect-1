"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useUser } from "@clerk/nextjs"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { BookOpen, GraduationCap } from "lucide-react"
import { authApi } from "@/services/api"

export default function RoleSelectionPage() {
  const router = useRouter()
  const { isLoaded, isSignedIn, user } = useUser()
  const [loading, setLoading] = useState<"student" | "teacher" | null>(null)
  const [error, setError] = useState("")

  if (!isLoaded) return null
  if (!isSignedIn) {
    router.replace("/sign-in")
    return null
  }

  const handleSelect = async (role: "student" | "teacher") => {
    if (!user?.primaryEmailAddress?.emailAddress) return
    setError("")
    setLoading(role)
    try {
      const res = await fetch("/api/proxy/update-role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user.primaryEmailAddress.emailAddress, role }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || data?.success === false) {
        throw new Error(data?.message || "Role update failed")
      }
      // Store role for dashboards that still reference localStorage
      localStorage.setItem("role", role)
      router.replace("/onboarding")
    } catch (e: any) {
      setError(e?.message || "Failed to set role. Please try again.")
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="container mx-auto max-w-2xl py-12">
      <h1 className="text-3xl font-bold mb-2">Choose your role</h1>
      <p className="text-muted-foreground mb-8">Tell us how you want to use TutorConnected.</p>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5" />
              I am a Student
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Find teachers, book classes, and track your learning.
            </p>
            <Button className="w-full" onClick={() => handleSelect("student")} disabled={loading === "student"}>
              {loading === "student" ? "Setting up..." : "Continue as Student"}
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              I am a Teacher
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Create teaching gigs, manage bookings, and earn.
            </p>
            <Button className="w-full" onClick={() => handleSelect("teacher")} disabled={loading === "teacher"}>
              {loading === "teacher" ? "Setting up..." : "Continue as Teacher"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
