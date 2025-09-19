"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { ProfileHeader } from "@/components/profile/profile-header"
import { ExperienceSection } from "@/components/profile/experience-section"
import { EducationSection } from "@/components/profile/education-section"
import { WorkSection } from "@/components/profile/work-section"
import { DemoVideoSection } from "@/components/profile/demo-video-section"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Star, MessageCircle, Calendar, Award, ArrowLeft, Loader2 } from "lucide-react"
import { UserProfile } from "@/lib/types/profile"
import { usersApi } from "@/services/api"
import Link from "next/link"

export default function PublicTeacherFullProfilePage() {
  const params = useParams<{ id: string }>()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoading(true)
        setError("")
        const response = await usersApi.getUser(params.id)
        const userData = response.data

        // Transform the API response to match UserProfile interface
        const transformedProfile: UserProfile = {
          id: userData._id,
          name: userData.name,
          email: userData.email,
          phone: userData.phone || "",
          location: userData.location || "",
          bio: userData.profile?.bio || "",
          headline: userData.headline || "Expert Teacher",
          userType: userData.role === "teacher" ? "teacher" : "student",
          avatar: userData.avatar || "",
          coverImage: userData.coverImage || "",
          experiences: userData.profile?.experiences || [],
          education: userData.profile?.education || [],
          work: userData.profile?.work || [],
          demoVideos: userData.profile?.demoVideos || [],
          skills: userData.profile?.skills || [],
          languages: userData.profile?.languages || [],
          subjects: userData.profile?.subjects || [],
          hourlyRate: userData.profile?.hourlyRate,
          availability: userData.profile?.availability || "",
          timezone: userData.profile?.timezone || ""
        }

        setProfile(transformedProfile)
      } catch (e: any) {
        setError(e?.response?.data?.message || "Failed to load teacher profile")
      } finally {
        setLoading(false)
      }
    }

    if (params?.id) {
      loadProfile()
    }
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
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  if (!profile) return null

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Back Button */}
        <div className="mb-6">
          <Link href={`/teacher/${params.id}`}>
            <Button variant="outline" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Gigs
            </Button>
          </Link>
        </div>

        {/* Profile Header */}
        <ProfileHeader 
          profile={profile} 
          onUpdate={() => {}} // Read-only for public view
          isEditable={false} 
        />

        {/* Main Content - All sections displayed together */}
        <div className="mt-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content Column */}
            <div className="lg:col-span-2 space-y-8">
              {/* About Section */}
              <Card>
                <CardHeader>
                  <CardTitle>About</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 leading-relaxed">
                    {profile.bio || "No bio available."}
                  </p>
                </CardContent>
              </Card>

              {/* Skills */}
              {profile.skills && profile.skills.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Award className="h-5 w-5" />
                      Skills
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {profile.skills.map((skill, index) => (
                        <Badge key={index} variant="secondary">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Subjects */}
              {profile.subjects && profile.subjects.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Teaching Subjects</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {profile.subjects.map((subject, index) => (
                        <Badge key={index} variant="outline">
                          {subject}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Experience Section */}
              <ExperienceSection 
                experiences={profile.experiences || []} 
                onUpdate={() => {}} // Read-only for public view
                isEditable={false} 
              />

              {/* Education Section */}
              <EducationSection 
                education={profile.education || []} 
                onUpdate={() => {}} // Read-only for public view
                isEditable={false} 
              />

              {/* Work Section */}
              <WorkSection 
                work={profile.work || []} 
                onUpdate={() => {}} // Read-only for public view
                isEditable={false} 
              />

              {/* Demo Videos Section */}
              <DemoVideoSection 
                videos={profile.demoVideos || []} 
                onUpdate={() => {}} // Read-only for public view
                isEditable={false} 
              />
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Contact Info */}
              <Card>
                <CardHeader>
                  <CardTitle>Contact Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {profile.location && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-medium">Location:</span>
                      <span className="text-gray-600">{profile.location}</span>
                    </div>
                  )}
                  {profile.hourlyRate && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-medium">Hourly Rate:</span>
                      <span className="text-green-600 font-semibold">${profile.hourlyRate}/hr</span>
                    </div>
                  )}
                  {profile.languages && profile.languages.length > 0 && (
                    <div className="text-sm">
                      <span className="font-medium">Languages:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {profile.languages.map((lang, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {lang}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Quick Stats */}
              <Card>
                <CardHeader>
                  <CardTitle>Quick Stats</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <Star className="h-4 w-4 text-yellow-500" />
                      Rating
                    </span>
                    <span className="font-semibold">4.9/5</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <MessageCircle className="h-4 w-4 text-blue-500" />
                      Students Taught
                    </span>
                    <span className="font-semibold">150+</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-green-500" />
                      Response Time
                    </span>
                    <span className="font-semibold">&lt; 1 hour</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
