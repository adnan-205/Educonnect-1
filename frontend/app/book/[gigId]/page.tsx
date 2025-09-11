"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { useUser } from "@clerk/nextjs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { gigsApi, bookingsApi } from "@/services/api"
import { Loader2, Calendar, Clock, User } from "lucide-react"

interface Gig {
  _id: string
  title: string
  description: string
  category: string
  price: number
  duration: number
  teacher: {
    _id: string
    name: string
    email: string
  }
}

export default function BookGigPage() {
  const router = useRouter()
  const params = useParams<{ gigId: string }>()
  const { isLoaded, isSignedIn } = useUser()

  const [gig, setGig] = useState<Gig | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [form, setForm] = useState({ scheduledDate: "", scheduledTime: "" })

  // Auth guard
  useEffect(() => {
    if (!isLoaded) return
    if (!isSignedIn) {
      router.replace("/sign-in")
    }
  }, [isLoaded, isSignedIn, router])

  // Load gig details
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        const res = await gigsApi.getGig(params.gigId)
        setGig(res.data)
      } catch (e: any) {
        setError(e?.response?.data?.message || "Failed to load gig")
      } finally {
        setLoading(false)
      }
    }
    if (params?.gigId) load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params?.gigId])

  const submitBooking = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!gig) return
    setError("")
    setSuccess("")
    try {
      setSubmitting(true)
      await bookingsApi.createBooking({
        gig: gig._id,
        scheduledDate: form.scheduledDate,
        scheduledTime: form.scheduledTime,
      })
      setSuccess("Booking request submitted!")
      setTimeout(() => router.replace("/dashboard-2"), 800)
    } catch (e: any) {
      setError(e?.response?.data?.message || "Failed to create booking")
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

  if (error) {
    return (
      <div className="container mx-auto px-4 py-10">
        <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>
      </div>
    )
  }

  if (!gig) return null

  return (
    <div className="container mx-auto max-w-2xl px-4 py-10">
      <Card>
        <CardHeader>
          <CardTitle>Book: {gig.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-6 space-y-2">
            <div className="flex items-center gap-2 text-muted-foreground">
              <User className="h-4 w-4" /> <span>Teacher: {gig.teacher.name}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-4 w-4" /> <span>Category: {gig.category}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-4 w-4" /> <span>Duration: {gig.duration} min • ${gig.price}/hr</span>
            </div>
          </div>

          {success && (
            <Alert className="mb-4"><AlertDescription>{success}</AlertDescription></Alert>
          )}
          {error && (
            <Alert variant="destructive" className="mb-4"><AlertDescription>{error}</AlertDescription></Alert>
          )}

          <form onSubmit={submitBooking} className="space-y-4">
            <div>
              <Label htmlFor="date">Preferred Date</Label>
              <Input id="date" type="date" required value={form.scheduledDate} onChange={(e) => setForm({ ...form, scheduledDate: e.target.value })} min={new Date().toISOString().split('T')[0]} />
            </div>
            <div>
              <Label htmlFor="time">Preferred Time</Label>
              <Input id="time" type="time" required value={form.scheduledTime} onChange={(e) => setForm({ ...form, scheduledTime: e.target.value })} />
            </div>
            <div className="flex items-center gap-3">
              <Button type="submit" disabled={submitting}>
                {submitting ? (<><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Booking...</>) : 'Submit Booking Request'}
              </Button>
              <Button type="button" variant="outline" onClick={() => router.back()} disabled={submitting}>Cancel</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
