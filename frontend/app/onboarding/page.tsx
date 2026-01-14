"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useUser } from "@clerk/nextjs"
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
  const { user: clerkUser, isLoaded: clerkLoaded } = useUser()
  const [role, setRole] = useState<"student" | "teacher" | "">("")
  const [marketingSource, setMarketingSource] = useState("")
  const [loading, setLoading] = useState(false)

  const [isAlreadyOnboarded, setIsAlreadyOnboarded] = useState(false)
  const [existingRole, setExistingRole] = useState<string | null>(null)

  useEffect(() => {
    // Prefill from localStorage if available
    try {
      const userStr = typeof window !== "undefined" ? localStorage.getItem("user") : null
      if (userStr) {
        const u = JSON.parse(userStr)
        if (u?.role) {
          setRole(u.role)
          setExistingRole(u.role)
        }
        if (u?.marketingSource) setMarketingSource(u.marketingSource)
        if (u?.isOnboarded === true) {
          // If already onboarded and has role, go to dashboard
          if (u?.role) {
            router.replace("/dashboard")
            return
          }
          setIsAlreadyOnboarded(true)
        }
      }
    } catch { }
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!role) {
      toast({ title: "Missing info", description: "Please select your role.", variant: "destructive" })
      return
    }

    // Get name from Clerk user
    const name = clerkUser?.fullName || clerkUser?.firstName || clerkUser?.username || ""
    if (!name) {
      toast({ title: "Missing info", description: "Please ensure your name is set in your account.", variant: "destructive" })
      return
    }

    try {
      setLoading(true)
      const payload: any = { name, role, marketingSource, isOnboarded: true }
      const res = await usersApi.updateMe(payload)
      const updated = res?.data
      if (updated) {
        // Persist to localStorage for client-side checks
        // After completing onboarding, isOnboarded should always be true
        localStorage.setItem("user", JSON.stringify({
          id: updated._id || updated.id,
          name: updated.name,
          email: updated.email,
          role: updated.role,
          isOnboarded: true, // Always true after completing onboarding
          marketingSource: updated.marketingSource,
        }))
        localStorage.setItem("role", updated.role)
        toast({ title: "Welcome!", description: "Your profile has been updated." })
        router.replace("/dashboard")
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
      <Card>
        <CardHeader>
          <CardTitle>Complete your profile</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">We need a few details to personalize your experience.</p>
        </CardHeader>
        <CardContent>
          {!clerkLoaded ? (
            <div className="text-center py-8">Loading...</div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {clerkUser && (
                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Name from your account:</p>
                  <p className="font-semibold text-foreground">
                    {clerkUser.fullName || clerkUser.firstName || clerkUser.username || "Not set"}
                  </p>
                  {!clerkUser.fullName && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Update your name in your account settings if needed.
                    </p>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <Label>Role</Label>
                <Select 
                  value={role} 
                  onValueChange={(v) => setRole(v as any)}
                  disabled={!!existingRole}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select your role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="student">Student</SelectItem>
                    <SelectItem value="teacher">Teacher</SelectItem>
                  </SelectContent>
                </Select>
                {existingRole && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Your role is locked as <span className="font-semibold capitalize">{existingRole}</span>. 
                    To change your role, please contact support.
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="source">Where did you hear about us?</Label>
                <Input id="source" value={marketingSource} onChange={(e) => setMarketingSource(e.target.value)} placeholder="Google, Friend, Social Media, etc." />
              </div>

              <div className="pt-2">
                <Button type="submit" disabled={loading || !clerkUser} className="w-full">
                  {loading ? "Saving..." : "Continue to Dashboard"}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
