import React from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Star } from "lucide-react"
import ReviewForm from "@/components/reviews/review-form"

async function getGig(id: string) {
  const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'
  const res = await fetch(`${base}/gigs/${id}`, { cache: 'no-store' })
  if (!res.ok) throw new Error('Failed to load gig')
  return res.json()
}

async function getGigReviews(id: string) {
  const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'
  const url = `${base}/gigs/${id}/reviews?limit=10&sort=-createdAt`
  const res = await fetch(url, { cache: 'no-store' })
  if (!res.ok) return { data: [] }
  return res.json()
}

export default async function GigPublicPage({ params }: { params: Promise<{ id: string }> | { id: string } }) {
  const resolved = (params as any)?.then ? await (params as Promise<{ id: string }>) : (params as { id: string })
  const id = resolved.id

  const gigRes = await getGig(id)
  const gig = gigRes?.data || gigRes
  const reviewsRes = await getGigReviews(id)
  const reviews = reviewsRes?.data || []

  const teacher = gig?.teacher || {}
  const aggRating = gig?.averageRating || 0
  const reviewsCount = gig?.reviewsCount || 0

  const rounded = Math.round(Number(aggRating) * 10) / 10
  const starFilled = Math.round(Number(aggRating))
  const buckets = [1,2,3,4,5].reduce((acc: Record<number, number>, k) => { acc[k] = 0; return acc }, {} as Record<number, number>)
  for (const r of reviews) {
    const k = Math.max(1, Math.min(5, Math.floor(Number(r?.rating) || 0)))
    buckets[k] = (buckets[k] || 0) + 1
  }
  const total = reviews.length || reviewsCount || 0

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Course",
    name: gig?.title,
    description: gig?.description,
    provider: {
      "@type": "Person",
      name: teacher?.name,
    },
    aggregateRating: reviewsCount > 0 ? {
      "@type": "AggregateRating",
      ratingValue: aggRating,
      reviewCount: reviewsCount,
    } : undefined,
    review: (reviews || []).slice(0, 10).map((r: any) => ({
      "@type": "Review",
      author: { "@type": "Person", name: r?.student?.name || 'Student' },
      reviewBody: r?.comment || '',
      name: r?.title || `Review`,
      reviewRating: { "@type": "Rating", ratingValue: r?.rating || 0, bestRating: 5, worstRating: 1 },
      datePublished: r?.createdAt,
    })),
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <div className="max-w-5xl mx-auto space-y-6">
        <Card className="bg-white shadow-sm border-0">
          <CardHeader>
            <CardTitle className="text-2xl">{gig?.title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={teacher?.avatar} />
                <AvatarFallback>{(teacher?.name || 'T').split(' ').map((n: string) => n[0]).join('')}</AvatarFallback>
              </Avatar>
              <div>
                <div className="font-medium">{teacher?.name}</div>
                <div className="text-sm text-gray-500">{gig?.category} • {gig?.duration} min • ${gig?.price}/session</div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
              <div className="flex items-center gap-4">
                <div className="text-4xl font-bold">{rounded.toFixed(1)}</div>
                <div>
                  <div className="flex items-center">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className={`h-5 w-5 ${i < starFilled ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}`} />
                    ))}
                  </div>
                  <div className="text-xs text-gray-500">{total} review{total === 1 ? '' : 's'}</div>
                </div>
              </div>
              <div className="md:col-span-2 grid grid-rows-5 gap-1">
                {[5,4,3,2,1].map((k) => {
                  const count = buckets[k] || 0
                  const pct = total ? Math.round((count / total) * 100) : 0
                  return (
                    <div key={k} className="flex items-center gap-2 text-sm">
                      <span className="w-8 text-right text-xs text-gray-600">{k}★</span>
                      <div className="flex-1 h-2 bg-gray-200 rounded">
                        <div className="h-2 bg-yellow-400 rounded" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="w-10 text-right text-xs text-gray-600">{pct}%</span>
                    </div>
                  )
                })}
              </div>
            </div>

            <p className="text-gray-700 whitespace-pre-line leading-relaxed">{gig?.description}</p>
            <div className="flex items-center gap-3">
              <Link href={`/book/${gig?._id}`} className="inline-flex items-center px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700">Book this class</Link>
              <a href="#review" className="inline-flex items-center px-4 py-2 rounded-md border hover:bg-gray-50">Write a review</a>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-sm border-0">
          <CardHeader>
            <CardTitle>Reviews</CardTitle>
          </CardHeader>
          <CardContent>
            {(reviews || []).length === 0 ? (
              <div className="text-sm text-gray-500">No reviews yet.</div>
            ) : (
              <div className="grid gap-4">
                {reviews.map((rv: any) => (
                  <div key={rv._id} itemScope itemType="https://schema.org/Review" className="border rounded-lg p-4 hover:shadow-sm transition">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={rv?.student?.avatar} />
                          <AvatarFallback>{(rv?.student?.name || 'S').split(' ').map((n: string) => n[0]).join('')}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div itemProp="author" className="font-medium">{rv?.student?.name || 'Student'}</div>
                          <div className="text-xs text-gray-500">{new Date(rv?.createdAt).toLocaleString()}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} className={`h-4 w-4 ${i < (rv?.rating || 0) ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}`} />
                        ))}
                      </div>
                    </div>
                    {rv?.title && <div className="font-semibold mt-2" itemProp="name">{rv.title}</div>}
                    {rv?.comment && <p className="text-sm text-gray-700 mt-1" itemProp="reviewBody">{rv.comment}</p>}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div id="review">
          <ReviewForm gigId={gig?._id} />
        </div>
      </div>
    </div>
  )
}
