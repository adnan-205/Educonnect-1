"use client"

import React, { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { bookingsApi, reviewsApi } from "@/services/api"
import { Star } from "lucide-react"
import { useUser } from "@clerk/nextjs"
import { Input } from "@/components/ui/input"

export default function ReviewForm({ gigId }: { gigId: string }) {
  const { isLoaded, isSignedIn } = useUser()
  const { toast } = useToast()
  const [eligible, setEligible] = useState(false)
  const [alreadyReviewed, setAlreadyReviewed] = useState<any>(null)
  const [rating, setRating] = useState<number>(0)
  const [hover, setHover] = useState<number>(0)
  const [comment, setComment] = useState("")
  const [title, setTitle] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const role = useMemo(() => (typeof window !== 'undefined' ? localStorage.getItem('role') : null), [])

  useEffect(() => {
    const load = async () => {
      try {
        if (!isLoaded || !isSignedIn || !gigId) return
        if (role !== 'student') return
        try {
          const mine = await reviewsApi.getMyReviewForGig(gigId)
          setAlreadyReviewed(mine?.data || null)
          if (mine?.data) return
        } catch {}
        try {
          const res = await bookingsApi.getMyBookings()
          const list: any[] = res?.data || []
          const ok = list.some((b) => String(b?.gig?._id || b?.gig) === String(gigId) && b?.status === 'completed')
          setEligible(ok)
        } catch {}
      } catch {}
    }
    load()
  }, [isLoaded, isSignedIn, gigId, role])

  if (role !== 'student') return null
  if (alreadyReviewed) return null
  if (!eligible) return null

  const submit = async () => {
    if (rating < 1 || rating > 5) {
      toast({ title: 'Invalid rating', description: 'Please select a rating between 1 and 5', variant: 'destructive' })
      return
    }
    try {
      setSubmitting(true)
      await reviewsApi.createReview(gigId, { rating: Math.min(5, Math.max(1, Number(rating))), title: title.trim() || undefined, comment: comment.trim() || undefined })
      toast({ title: 'Thanks for your review!' })
      setEligible(false)
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || 'Failed to submit review'
      toast({ title: 'Unable to submit', description: msg, variant: 'destructive' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="rounded-xl border shadow-sm overflow-hidden bg-white">
      <div className="bg-gradient-to-r from-amber-100 via-yellow-100 to-white px-6 py-5 border-b">
        <div className="text-sm uppercase tracking-wider text-amber-700 font-medium">Your feedback matters</div>
        <div className="text-xl font-semibold text-gray-900">Rate this class</div>
      </div>
      <div className="p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2">
            {Array.from({ length: 5 }).map((_, i) => {
              const idx = i + 1
              const active = (hover || rating) >= idx
              return (
                <button
                  key={idx}
                  type="button"
                  onMouseEnter={() => setHover(idx)}
                  onMouseLeave={() => setHover(0)}
                  onClick={() => setRating(idx)}
                  className={`p-1 transition-transform ${active ? 'scale-105' : 'hover:scale-105'}`}
                  aria-label={`Rate ${idx}`}
                >
                  <Star className={`h-8 w-8 ${active ? 'text-yellow-500 fill-yellow-500 drop-shadow-sm' : 'text-gray-300'}`} />
                </button>
              )
            })}
          </div>
          <div className="text-xs text-gray-500">
            {rating === 0 && 'Click a star to rate'}
            {rating === 1 && 'Terrible'}
            {rating === 2 && 'Poor'}
            {rating === 3 && 'Fair'}
            {rating === 4 && 'Good'}
            {rating === 5 && 'Excellent'}
          </div>
        </div>

        <Input
          placeholder="Optional title (e.g., Great explanation on derivatives)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <div>
          <Textarea
            placeholder="Share your experience (what you loved, what could be improved)"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="min-h-[110px]"
            maxLength={2000}
          />
          <div className="mt-1 text-right text-xs text-gray-500">{comment.length}/2000</div>
        </div>

        <div className="flex items-center justify-end gap-2">
          <Button variant="outline" disabled={submitting} onClick={() => { setRating(0); setTitle(""); setComment("") }}>Clear</Button>
          <Button onClick={submit} disabled={submitting || rating < 1} className="bg-yellow-500 hover:bg-yellow-600 text-black">
            {submitting ? 'Submitting...' : 'Submit Review'}
          </Button>
        </div>
      </div>
    </div>
  )
}
