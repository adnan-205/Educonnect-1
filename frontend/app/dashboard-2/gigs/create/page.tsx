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
import { gigsApi, uploadsApi } from "@/services/api"
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
  const [thumbFile, setThumbFile] = useState<File | null>(null)
  const [thumbPreview, setThumbPreview] = useState<string>("")

  const onChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }))
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    // Client-side validation to avoid 400s
    if (!form.title.trim() || !form.description.trim()) {
      setError("Title and description are required")
      return
    }
    if (!form.category) {
      setError("Please select a category")
      return
    }
    const priceNum = Number(form.price)
    const durationNum = Number(form.duration)
    if (!Number.isFinite(priceNum) || priceNum <= 0) {
      setError("Price must be a positive number")
      return
    }
    if (!Number.isFinite(durationNum) || durationNum <= 0) {
      setError("Duration must be a positive number of minutes")
      return
    }
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
      const res = await gigsApi.createGig(payload)
      const created = res?.data || null
      const gigId = created?._id || created?.id

      // If a local thumbnail was chosen, upload it and auto-link to the gig
      if (gigId && thumbFile) {
        try {
          await uploadsApi.uploadGigThumbnail(thumbFile, gigId)
        } catch (err: any) {
          // Do not block creation on thumbnail upload failures
          console.error('Thumbnail upload failed, proceeding:', err)
        }
      }
      router.replace("/dashboard-2/gigs")
    } catch (e: any) {
      const msg = e?.response?.data?.message || "Failed to create gig"
      const errs = e?.response?.data?.errors
      setError(errs && Array.isArray(errs) && errs.length ? `${msg}: ${errs.join(', ')}` : msg)
    } finally {
      setSubmitting(false)
    }
  }

  const onThumbSelect: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    setError("")
    const f = e.target.files?.[0] || null
    if (!f) {
      setThumbFile(null)
      setThumbPreview("")
      return
    }
    if (!/^image\//i.test(f.type)) {
      setError("Please select a valid image file")
      return
    }
    if (f.size > 5 * 1024 * 1024) {
      setError("Image must be 5MB or smaller")
      return
    }
    setThumbFile(f)
    const url = URL.createObjectURL(f)
    setThumbPreview(url)
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
              <Input id="title" name="title" maxLength={100} required value={form.title} onChange={onChange} placeholder="e.g., Algebra Basics for High School" />
              <div className="text-xs text-muted-foreground mt-1">{form.title.length}/100</div>
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" name="description" maxLength={500} required value={form.description} onChange={onChange} placeholder="Describe what you teach, your approach, and what students will learn." />
              <div className="text-xs text-muted-foreground mt-1">{form.description.length}/500</div>
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

            {/* Local upload */}
            <div className="space-y-2">
              <Label>Upload Thumbnail (local image)</Label>
              <div className="flex items-center gap-3">
                <Input type="file" accept="image/*" onChange={onThumbSelect} />
              </div>
              {(thumbPreview || form.thumbnailUrl) && (
                <div className="mt-2">
                  <img src={thumbPreview || form.thumbnailUrl} alt="Thumbnail preview" className="w-full max-w-xs h-40 object-cover rounded border" />
                </div>
              )}
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
