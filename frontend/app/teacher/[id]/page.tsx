"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { usersApi } from "@/services/api"
import { BookOpen, Star, Clock, Loader2, User } from "lucide-react"
import { getGigThumb } from "@/lib/images"

interface Teacher {
  _id: string
  name: string
  email: string
  role?: string
  avatar?: string
  headline?: string
  profile?: {
    bio?: string
    subjects?: string[]
    hourlyRate?: number
    skills?: string[]
  }
}

interface Gig {
  _id: string
  title: string
  description: string
  category: string
  price: number
  duration: number
  createdAt: string
  thumbnailUrl?: string
}

export default function PublicTeacherProfilePage() {
  const params = useParams<{ id: string }>()
  const [teacher, setTeacher] = useState<Teacher | null>(null)
  const [gigs, setGigs] = useState<Gig[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        setError("")
        const userRes = await usersApi.getUser(params.id)
        const gigsRes = await usersApi.getUserGigs(params.id)
        setTeacher(userRes.data)
        setGigs(gigsRes.data || [])
      } catch (e: any) {
        setError(e?.response?.data?.message || "Failed to load teacher profile")
      } finally {
        setLoading(false)
      }
    }
    if (params?.id) load()
  }, [params?.id])

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

  if (!teacher) return null

  return (
    <div className="container mx-auto px-4 py-10 space-y-8">
      {/* Header */}
      <Card className="overflow-hidden">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={teacher.avatar} />
              <AvatarFallback className="text-xl">
                {teacher.name?.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h1 className="text-2xl font-semibold text-gray-900">{teacher.name}</h1>
                  <p className="text-sm text-gray-500">{teacher.headline || 'Expert Teacher'}</p>
                </div>
                {teacher.profile?.hourlyRate && (
                  <div className="text-right">
                    <div className="text-sm text-gray-500">Starting at</div>
                    <div className="text-xl font-bold text-green-600">${teacher.profile.hourlyRate}/hr</div>
                  </div>
                )}
              </div>
              <div className="mt-3">
                <Link href={`/teacher/${params.id}/profile`}>
                  <Button size="sm" variant="outline" className="gap-2">
                    <User className="h-4 w-4" /> View Full Profile
                  </Button>
                </Link>
              </div>
              {teacher.profile?.subjects && teacher.profile.subjects.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-3">
                  {teacher.profile.subjects.slice(0, 4).map((s, i) => (
                    <Badge key={i} variant="secondary" className="text-xs">{s}</Badge>
                  ))}
                </div>
              )}
              {teacher.profile?.bio && (
                <p className="mt-3 text-sm text-gray-700 max-w-3xl">{teacher.profile.bio}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Gigs */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Available Gigs</h2>
          <div className="text-sm text-gray-500">{gigs.length} offerings</div>
        </div>
        {gigs.length === 0 ? (
          <Card>
            <CardContent className="p-10 text-center text-gray-600">
              No gigs published yet.
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {gigs.map((gig) => (
              <Card key={gig._id} className="overflow-hidden hover:shadow-md transition-shadow">
                <div className="aspect-video w-full overflow-hidden bg-muted">
                  <img src={getGigThumb(gig.thumbnailUrl, 640, 360)} alt={`${gig.title} thumbnail`} className="w-full h-full object-cover" />
                </div>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary">{gig.category}</Badge>
                    <div className="text-sm text-gray-500">${gig.price}/hr</div>
                  </div>
                  <CardTitle className="text-base leading-snug line-clamp-2">{gig.title}</CardTitle>
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <div className="inline-flex items-center gap-1"><Clock className="h-4 w-4" /> {gig.duration} min</div>
                    <div className="inline-flex items-center gap-1 text-amber-500"><Star className="h-4 w-4 fill-current" /> 4.8</div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-gray-400">Created {new Date(gig.createdAt).toLocaleDateString()}</div>
                    <Link href={`/book/${gig._id}`}>
                      <Button size="sm">Book Now</Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
