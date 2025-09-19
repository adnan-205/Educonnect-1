"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { usersApi } from "@/services/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"

export default function OnboardingPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [name, setName] = useState("")
  const [role, setRole] = useState<"student" | "teacher" | "admin" | "">("")
  const [marketingSource, setMarketingSource] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // Prefill from localStorage if available
    try {
      const userStr = typeof window !== "undefined" ? localStorage.getItem("user") : null
      if (userStr) {
        const u = JSON.parse(userStr)
        if (u?.name) setName(u.name)
        if (u?.role) setRole(u.role)
        if (u?.marketingSource) setMarketingSource(u.marketingSource)
        if (u?.isOnboarded) {
          // If already onboarded, go to dashboard
          router.replace("/dashboard-2")
        }
      }
    } catch {}
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !role) {
      toast({ title: "Missing info", description: "Please provide your full name and role.", variant: "destructive" })
      return
    }
    try {
      setLoading(true)
      const payload: any = { name, role, marketingSource, isOnboarded: true }
      const res = await usersApi.updateMe(payload)
      const updated = res?.data
      if (updated) {
        // Persist to localStorage for client-side checks
        localStorage.setItem("user", JSON.stringify({
          id: updated._id || updated.id,
          name: updated.name,
          email: updated.email,
          role: updated.role,
          isOnboarded: true,
          marketingSource: updated.marketingSource,
        }))
        localStorage.setItem("role", updated.role)
        toast({ title: "Welcome!", description: "Your profile has been updated." })
        router.replace("/dashboard-2")
      } else {
        throw new Error("No response")
      }
    } catch (err: any) {
      toast({ title: "Error", description: err?.response?.data?.message || "Failed to save your info.", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Card className="bg-white shadow-sm border-0">
        <CardHeader>
          <CardTitle>Complete your profile</CardTitle>
          <p className="text-sm text-gray-600 mt-1">We need a few details to personalize your experience.</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Full name</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="John Doe" />
            </div>

            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={role} onValueChange={(v) => setRole(v as any)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select your role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="student">Student</SelectItem>
                  <SelectItem value="teacher">Teacher</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="source">Where did you hear about us?</Label>
              <Input id="source" value={marketingSource} onChange={(e) => setMarketingSource(e.target.value)} placeholder="Google, Friend, Social Media, etc." />
            </div>

            <div className="pt-2">
              <Button type="submit" disabled={loading} className="w-full">
                {loading ? "Saving..." : "Continue to Dashboard"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
