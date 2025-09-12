"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { gigsApi } from "@/services/api"
import { Loader2 } from "lucide-react"

const CATEGORIES = [
  "Mathematics",
  "Science",
  "English",
  "History",
  "Computer Science",
  "Art",
]

export default function CreateGigPage() {
  const router = useRouter()
  const [form, setForm] = useState({
    title: "",
    description: "",
    price: "",
    category: "",
    duration: "",
    thumbnailUrl: "",
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")

  const onChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }))
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    try {
      setSubmitting(true)
      const payload = {
        title: form.title,
        description: form.description,
        price: Number(form.price),
        category: form.category,
        duration: Number(form.duration),
        thumbnailUrl: form.thumbnailUrl || undefined,
      }
      await gigsApi.createGig(payload)
      router.replace("/dashboard-2/gigs")
    } catch (e: any) {
      setError(e?.response?.data?.message || "Failed to create gig")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Create New Gig</CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4"><AlertDescription>{error}</AlertDescription></Alert>
          )}

          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <Label htmlFor="title">Title</Label>
              <Input id="title" name="title" required value={form.title} onChange={onChange} placeholder="e.g., Algebra Basics for High School" />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" name="description" required value={form.description} onChange={onChange} placeholder="Describe what you teach, your approach, and what students will learn." />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="price">Price (USD/hour)</Label>
                <Input id="price" name="price" type="number" min={1} step={1} required value={form.price} onChange={onChange} />
              </div>
              <div>
                <Label>Category</Label>
                <Select value={form.category} onValueChange={(v) => setForm((f) => ({ ...f, category: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="duration">Session Duration (minutes)</Label>
                <Input id="duration" name="duration" type="number" min={15} step={5} required value={form.duration} onChange={onChange} />
              </div>
            </div>
            <div>
              <Label htmlFor="thumbnailUrl">Thumbnail URL (optional)</Label>
              <Input id="thumbnailUrl" name="thumbnailUrl" value={form.thumbnailUrl} onChange={onChange} placeholder="https://..." />
            </div>

            <div className="flex gap-3">
              <Button type="submit" disabled={submitting}>
                {submitting ? (<><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Creating...</>) : 'Create Gig'}
              </Button>
              <Button type="button" variant="outline" onClick={() => router.back()} disabled={submitting}>Cancel</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
