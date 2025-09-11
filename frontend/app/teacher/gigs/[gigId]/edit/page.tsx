"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { useUser } from "@clerk/nextjs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { gigsApi } from "@/services/api"
import { Loader2 } from "lucide-react"

const DAYS = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"] as const
const CATEGORIES = ["Mathematics","Programming","Languages","Science"] as const

type Day = typeof DAYS[number]

export default function EditGigPage() {
  const router = useRouter()
  const params = useParams<{ gigId: string }>()
  const { isLoaded, isSignedIn } = useUser()

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "Mathematics",
    price: "",
    duration: "60",
    availabilityDays: [] as Day[],
    availabilityTimes: "",
  })

  useEffect(() => {
    if (!isLoaded) return
    if (!isSignedIn) router.replace("/sign-in")
  }, [isLoaded, isSignedIn, router])

  useEffect(() => {
    const loadGig = async () => {
      try {
        setLoading(true)
        const res = await gigsApi.getGig(params.gigId)
        const g = res.data
        setForm({
          title: g.title || "",
          description: g.description || "",
          category: g.category || "Mathematics",
          price: String(g.price ?? ""),
          duration: String(g.duration ?? "60"),
          availabilityDays: (g.availability?.days || []) as Day[],
          availabilityTimes: (g.availability?.times || []).join(", "),
        })
      } catch (e: any) {
        setError(e?.response?.data?.message || "Failed to load gig")
      } finally {
        setLoading(false)
      }
    }
    if (params?.gigId) loadGig()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params?.gigId])

  const toggleDay = (day: Day) => {
    setForm(prev => ({
      ...prev,
      availabilityDays: prev.availabilityDays.includes(day)
        ? prev.availabilityDays.filter(d => d !== day)
        : [...prev.availabilityDays, day]
    }))
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")
    try {
      setSubmitting(true)
      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        category: form.category,
        price: Number(form.price),
        duration: Number(form.duration),
        availability: {
          days: form.availabilityDays,
          times: form.availabilityTimes
            .split(",")
            .map(t => t.trim())
            .filter(Boolean),
        }
      }
      await gigsApi.updateGig(params.gigId, payload)
      setSuccess("Gig updated successfully!")
      setTimeout(() => router.replace("/teacher/gigs"), 700)
    } catch (e: any) {
      setError(e?.response?.data?.message || "Failed to update gig")
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-10">
        <div className="flex items-center justify-center min-h-[300px]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto max-w-2xl px-4 py-10">
      <Card>
        <CardHeader>
          <CardTitle>Edit Gig</CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4"><AlertDescription>{error}</AlertDescription></Alert>
          )}
          {success && (
            <Alert className="mb-4"><AlertDescription>{success}</AlertDescription></Alert>
          )}

          <form onSubmit={onSubmit} className="space-y-5">
            <div>
              <Label htmlFor="title">Title</Label>
              <Input id="title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="category">Category</Label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(c => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="price">Price (per hour in USD)</Label>
                <Input id="price" type="number" min={1} step={1} value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="duration">Session Duration (minutes)</Label>
                <Input id="duration" type="number" min={15} step={15} value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} required />
              </div>
              <div>
                <Label htmlFor="times">Available Times (comma separated)</Label>
                <Input id="times" value={form.availabilityTimes} onChange={(e) => setForm({ ...form, availabilityTimes: e.target.value })} />
              </div>
            </div>

            <div>
              <Label>Available Days</Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-2">
                {DAYS.map((day) => (
                  <label key={day} className="flex items-center gap-2">
                    <Checkbox checked={form.availabilityDays.includes(day)} onCheckedChange={() => toggleDay(day)} />
                    <span className="text-sm">{day}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button type="submit" disabled={submitting}>
                {submitting ? (<><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving...</>) : 'Save Changes'}
              </Button>
              <Button type="button" variant="outline" onClick={() => router.back()} disabled={submitting}>Cancel</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
