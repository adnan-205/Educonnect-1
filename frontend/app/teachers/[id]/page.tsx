"use client"

import { useEffect, useMemo, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { usersApi } from "@/services/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ProfileHeader } from "@/components/profile/profile-header"
import { ExperienceSection } from "@/components/profile/experience-section"
import { EducationSection } from "@/components/profile/education-section"
import { WorkSection } from "@/components/profile/work-section"
import { DemoVideoSection } from "@/components/profile/demo-video-section"
import type { UserProfile, Experience, Education, Work, DemoVideo } from "@/lib/types/profile"
import Link from "next/link"

export default function PublicTeacherProfilePage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const teacherId = params?.id

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [user, setUser] = useState<any>(null)
  const [gigs, setGigs] = useState<any[]>([])

  useEffect(() => {
    const load = async () => {
      if (!teacherId) return
      try {
        setLoading(true)
        setError("")
        const [u, g] = await Promise.all([
          usersApi.getUser(teacherId as string),
          usersApi.getUserGigs(teacherId as string)
        ])
        setUser(u?.data || null)
        setGigs(g?.data || [])
      } catch (e: any) {
        setError(e?.response?.data?.message || "Failed to load profile")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [teacherId])

  const profile: UserProfile = useMemo(() => {
    // Map minimal backend user to our rich profile shape for display-only
    const name = user?.name || "Teacher"
    const email = user?.email || ""
    const bio = user?.profile?.bio || ""
    const avatar = user?.avatar || ""
    const coverImage = user?.coverImage || ""

    return {
      id: user?._id || teacherId || "",
      name,
      email,
      bio,
      avatar,
      coverImage,
      headline: user?.headline || "Teacher on TutorConnected",
      userType: "teacher",
      experiences: user?.profile?.experiences || [],
      education: user?.profile?.education || [],
      work: user?.profile?.work || [],
      skills: user?.profile?.skills || [],
      languages: user?.profile?.languages || [],
      subjects: user?.profile?.subjects || [],
      hourlyRate: user?.profile?.hourlyRate,
      availability: user?.profile?.availability || "",
      timezone: user?.profile?.timezone || "",
      demoVideos: (user?.profile?.demoVideos || []) as DemoVideo[],
      rating: typeof user?.teacherRatingAverage === 'number' ? user.teacherRatingAverage : 0,
      totalStudents: undefined,
      totalHours: undefined,
      reviews: typeof user?.teacherReviewsCount === 'number' ? user.teacherReviewsCount : 0,
      completionRate: undefined,
      responseTime: undefined,
    }
  }, [user, teacherId])

  const noop = () => {}

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {loading ? (
          <div className="text-center text-muted-foreground">Loading profile...</div>
        ) : error ? (
          <div className="text-center text-red-600">{error}</div>
        ) : (
          <>
            <ProfileHeader profile={profile} onUpdate={noop} isEditable={false} />

            <div className="space-y-6">
              <ExperienceSection experiences={profile.experiences} onUpdate={noop as any} isEditable={false} />
              <WorkSection work={profile.work} onUpdate={noop as any} isEditable={false} />
              <EducationSection education={profile.education} onUpdate={noop as any} isEditable={false} />
              <DemoVideoSection videos={profile.demoVideos || []} onUpdate={noop as any} isEditable={false} />
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Teacher's Gigs</CardTitle>
              </CardHeader>
              <CardContent>
                {gigs.length === 0 ? (
                  <div className="text-muted-foreground text-sm">No gigs found.</div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {gigs.map((gig: any) => (
                      <Card key={gig._id} className="bg-white shadow-sm border-0 hover:shadow-md transition-shadow">
                        <CardContent className="p-6">
                          <div className="text-center">
                            <Avatar className="h-20 w-20 mx-auto mb-4">
                              <AvatarImage src={gig.thumbnailUrl || "/placeholder.jpg"} />
                              <AvatarFallback>{nameToInitials(user?.name)}</AvatarFallback>
                            </Avatar>
                            <h3 className="font-semibold text-gray-900 mb-1">{gig.title}</h3>
                            <div className="flex items-center justify-center gap-6 mb-4 text-sm text-muted-foreground">
                              <span>${gig.price}/hr</span>
                              <span>{gig.duration} min</span>
                              <span>{gig.category}</span>
                            </div>
                            <Link href={`/book/${gig._id}`}>
                              <Button className="w-full">Book Now</Button>
                            </Link>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  )
}

function nameToInitials(name?: string) {
  if (!name) return "TC"
  return name.split(" ").map(n => n[0]).join("")
}
