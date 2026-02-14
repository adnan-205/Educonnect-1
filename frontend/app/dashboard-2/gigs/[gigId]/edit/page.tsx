"use client"

import React, { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { gigsApi, uploadsApi } from "@/services/api"
import { Loader2 } from "lucide-react"
import { CATEGORY_KEYS } from "@/lib/constants/categories"

interface Gig {
  _id: string
  title: string
  description: string
  price: number
  category: string
  duration: number
  thumbnailUrl?: string
}

export default function EditGigPage() {
  const params = useParams<{ gigId: string }>()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [thumbFile, setThumbFile] = useState<File | null>(null)
  const [thumbPreview, setThumbPreview] = useState<string>("")
  const [uploadingThumb, setUploadingThumb] = useState(false)
  const [removingThumb, setRemovingThumb] = useState(false)
  const [form, setForm] = useState({
    title: "",
    description: "",
    price: "",
    category: "",
    duration: "",
    thumbnailUrl: "",
  })

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        const res = await gigsApi.getGig(params.gigId)
        const gig: Gig = res.data
        setForm({
          title: gig.title || "",
          description: gig.description || "",
          price: String(gig.price ?? ""),
          category: gig.category || "",
          duration: String(gig.duration ?? ""),
          thumbnailUrl: gig.thumbnailUrl || "",
        })
      } catch (e: any) {
        setError(e?.response?.data?.message || "Failed to load gig")
      } finally {
        setLoading(false)
      }
    }
    if (params?.gigId) load()
  }, [params?.gigId])

  const handleChange: React.ChangeEventHandler<HTMLInputElement | HTMLTextAreaElement> = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }))
  }

  const onThumbSelect: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    setError("")
    const f = e.target.files?.[0] || null
    if (!f) {
      setThumbFile(null)
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

  const onUploadThumb = async () => {
    if (!thumbFile) return
    try {
      setUploadingThumb(true)
      const res = await uploadsApi.uploadGigThumbnail(thumbFile, params.gigId)
      const url = res?.data?.url || res?.gig?.thumbnailUrl
      if (url) {
        setForm((f) => ({ ...f, thumbnailUrl: url }))
        setThumbPreview(url)
      }
    } catch (e: any) {
      setError(e?.response?.data?.message || "Failed to upload thumbnail")
    } finally {
      setUploadingThumb(false)
    }
  }

  const onRemoveThumb = async () => {
    try {
      setRemovingThumb(true)
      await uploadsApi.deleteGigThumbnail(params.gigId as string)
      setForm((f) => ({ ...f, thumbnailUrl: "" }))
      setThumbPreview("")
      setThumbFile(null)
    } catch (e: any) {
      setError(e?.response?.data?.message || "Failed to remove thumbnail")
    } finally {
      setRemovingThumb(false)
    }
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
      await gigsApi.updateGig(params.gigId, payload)
      router.replace("/dashboard/gigs")
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to update gig")
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]"><Loader2 className="h-6 w-6 animate-spin" /></div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Edit Gig</CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4"><AlertDescription>{error}</AlertDescription></Alert>
          )}

          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <Label htmlFor="title">Title</Label>
              <Input id="title" name="title" required value={form.title} onChange={handleChange} />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" name="description" required value={form.description} onChange={handleChange} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="price">Price (TAKA/hour)</Label>
                <Input id="price" name="price" type="number" min={1} step={1} required value={form.price} onChange={handleChange} />
              </div>
              <div>
                <Label>Category</Label>
                <Select value={form.category} onValueChange={(v) => setForm((f) => ({ ...f, category: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORY_KEYS.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="duration">Session Duration (minutes)</Label>
                <Input id="duration" name="duration" type="number" min={15} step={5} required value={form.duration} onChange={handleChange} />
              </div>
            </div>
            <div>
              <Label htmlFor="thumbnailUrl">Thumbnail URL (optional)</Label>
              <Input id="thumbnailUrl" name="thumbnailUrl" value={form.thumbnailUrl} onChange={handleChange} placeholder="https://..." />
            </div>

            {/* Local upload */}
            <div className="space-y-2">
              <Label>Upload Thumbnail (local image)</Label>
              <div className="flex items-center gap-3">
                <Input type="file" accept="image/*" onChange={onThumbSelect} />
                <Button type="button" variant="secondary" disabled={!thumbFile || uploadingThumb} onClick={onUploadThumb}>
                  {uploadingThumb ? (<><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Uploading...</>) : 'Upload Thumbnail'}
                </Button>
                {(thumbPreview || form.thumbnailUrl) && (
                  <Button type="button" variant="destructive" disabled={removingThumb} onClick={onRemoveThumb}>
                    {removingThumb ? (<><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Removing...</>) : 'Remove Thumbnail'}
                  </Button>
                )}
              </div>
              {(thumbPreview || form.thumbnailUrl) && (
                <div className="mt-2">
                  <img src={thumbPreview || form.thumbnailUrl} alt="Thumbnail preview" className="w-full max-w-xs h-40 object-cover rounded border" />
                </div>
              )}
            </div>

            <div className="flex gap-3">
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
