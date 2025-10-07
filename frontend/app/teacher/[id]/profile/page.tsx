"use client"

import { useEffect, useMemo, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { usersApi } from "@/services/api"
import { ProfileHeader } from "@/components/profile/profile-header"
import { ExperienceSection } from "@/components/profile/experience-section"
import { EducationSection } from "@/components/profile/education-section"
import { WorkSection } from "@/components/profile/work-section"
import { DemoVideoSection } from "@/components/profile/demo-video-section"
import type { UserProfile, Experience, Education, Work, DemoVideo } from "@/lib/types/profile"
import { Card, CardContent } from "@/components/ui/card"

export default function TeacherProfilePage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const id = params?.id || ""

  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<UserProfile | null>(null)

  const backendUserId = useMemo(() => {
    try {
      const raw = typeof window !== 'undefined' ? localStorage.getItem('user') : null
      if (!raw) return null
      const parsed = JSON.parse(raw)
      return parsed?.id || parsed?._id || null
    } catch { return null }
  }, [])

  const isOwner = backendUserId && backendUserId === id

  useEffect(() => {
    const go = async () => {
      if (!id) {
        router.replace("/dashboard-2")
        return
      }
      try {
        setLoading(true)
        const res = await usersApi.getUser(id)
        const u = res?.data || {}
        // Transform backend user to UserProfile
        const role = u?.role === 'teacher' ? 'teacher' : 'student'
        const p = u?.profile || {}
        const demoVideos: DemoVideo[] = Array.isArray(p?.demoVideos) ? (p.demoVideos as any[]).map((v: any, idx: number) => ({
          id: `${idx}-${v?.videoUrl || 'video'}`,
          title: v?.title || '',
          description: v?.description || '',
          videoUrl: v?.videoUrl || '',
          thumbnailUrl: v?.thumbnailUrl,
          duration: v?.duration || '',
          subject: v?.subject || '',
          uploadDate: v?.uploadDate || new Date().toISOString().split('T')[0],
          videoType: v?.videoType === 'external' ? 'external' : 'local',
          cloudinaryPublicId: v?.cloudinaryPublicId,
        })) : []

        const mapped: UserProfile = {
          id: u?._id || id,
          name: u?.name || '',
          email: u?.email || '',
          phone: u?.phone,
          location: u?.location,
          bio: p?.bio || '',
          avatar: u?.avatar,
          coverImage: u?.coverImage,
          headline: u?.headline || '',
          userType: role,
          experiences: Array.isArray(p?.experiences)
            ? (p.experiences as any[]).map((exp: any, idx: number) => ({
                id: exp?.id || exp?._id || `${idx}-${exp?.title || ''}-${exp?.company || ''}-${exp?.startDate || ''}`,
                title: exp?.title || '',
                company: exp?.company || '',
                location: exp?.location || '',
                startDate: exp?.startDate || '',
                endDate: exp?.current ? undefined : exp?.endDate,
                current: !!exp?.current,
                description: exp?.description || '',
                skills: Array.isArray(exp?.skills) ? exp.skills : [],
              }))
            : [],
          education: Array.isArray(p?.education)
            ? (p.education as any[]).map((edu: any, idx: number) => ({
                id: edu?.id || edu?._id || `${idx}-${edu?.degree || ''}-${edu?.institution || ''}-${edu?.startDate || ''}`,
                degree: edu?.degree || '',
                institution: edu?.institution || '',
                location: edu?.location || '',
                startDate: edu?.startDate || '',
                endDate: edu?.current ? undefined : edu?.endDate,
                current: !!edu?.current,
                description: edu?.description || '',
                gpa: edu?.gpa || '',
                activities: Array.isArray(edu?.activities) ? edu.activities : [],
              }))
            : [],
          work: Array.isArray(p?.work)
            ? (p.work as any[]).map((w: any, idx: number) => ({
                id: w?.id || w?._id || `${idx}-${w?.position || ''}-${w?.company || ''}-${w?.startDate || ''}`,
                position: w?.position || '',
                company: w?.company || '',
                location: w?.location || '',
                startDate: w?.startDate || '',
                endDate: w?.current ? undefined : w?.endDate,
                current: !!w?.current,
                description: w?.description || '',
                achievements: Array.isArray(w?.achievements) ? w.achievements : [],
              }))
            : [],
          skills: Array.isArray(p?.skills) ? p.skills : [],
          languages: Array.isArray(p?.languages) ? p.languages : [],
          subjects: Array.isArray(p?.subjects) ? p.subjects : [],
          hourlyRate: p?.hourlyRate,
          availability: p?.availability,
          timezone: p?.timezone,
          demoVideos,
          rating: p?.rating,
          totalStudents: p?.totalStudents,
          totalHours: p?.totalHours,
          reviews: p?.reviews,
          completionRate: p?.completionRate,
          responseTime: p?.responseTime,
        }
        setProfile(mapped)
      } catch (e) {
        router.replace("/dashboard-2")
      } finally {
        setLoading(false)
      }
    }
    go()
  }, [id, router])

  const persistProfile = async (patch: Partial<UserProfile>) => {
    if (!patch) return
    // Prepare backend patch: top-level and nested profile.*
    const body: any = {}
    if (patch.name !== undefined) body.name = patch.name
    if (patch.headline !== undefined) body.headline = patch.headline
    if (patch.phone !== undefined) body.phone = patch.phone
    if (patch.location !== undefined) body.location = patch.location
    if (patch.avatar !== undefined) body.avatar = patch.avatar
    if (patch.coverImage !== undefined) body.coverImage = patch.coverImage

    const nested: any = {}
    if (patch.bio !== undefined) nested.bio = patch.bio
    if (patch.experiences !== undefined) nested.experiences = patch.experiences
    if (patch.education !== undefined) nested.education = patch.education
    if (patch.work !== undefined) nested.work = patch.work
    if (patch.skills !== undefined) nested.skills = patch.skills
    if (patch.languages !== undefined) nested.languages = patch.languages
    if (patch.subjects !== undefined) nested.subjects = patch.subjects
    if (patch.hourlyRate !== undefined) nested.hourlyRate = patch.hourlyRate
    if (patch.availability !== undefined) nested.availability = patch.availability
    if (patch.timezone !== undefined) nested.timezone = patch.timezone
    if (patch.demoVideos !== undefined) {
      // Strip UI-only fields before persisting
      nested.demoVideos = (patch.demoVideos || []).map(v => ({
        title: v.title,
        description: v.description,
        videoUrl: v.videoUrl,
        thumbnailUrl: v.thumbnailUrl,
        duration: v.duration,
        subject: v.subject,
        uploadDate: v.uploadDate,
        videoType: v.videoType,
        cloudinaryPublicId: (v as any).cloudinaryPublicId,
      }))
    }

    if (Object.keys(nested).length > 0) body.profile = nested

    try { await usersApi.updateMe(body) } catch {}
  }

  const handleHeaderUpdate = async (p: Partial<UserProfile>) => {
    if (!profile) return
    const merged = { ...profile, ...p }
    setProfile(merged)
    await persistProfile(p)
  }

  const handleExperiencesUpdate = async (experiences: Experience[]) => {
    if (!profile) return
    const merged = { ...profile, experiences }
    setProfile(merged)
    await persistProfile({ experiences })
  }

  const handleEducationUpdate = async (education: Education[]) => {
    if (!profile) return
    const merged = { ...profile, education }
    setProfile(merged)
    await persistProfile({ education })
  }

  const handleWorkUpdate = async (work: Work[]) => {
    if (!profile) return
    const merged = { ...profile, work }
    setProfile(merged)
    await persistProfile({ work })
  }

  const handleVideosUpdate = async (videos: DemoVideo[]) => {
    if (!profile) return
    const merged = { ...profile, demoVideos: videos }
    setProfile(merged)
    await persistProfile({ demoVideos: videos })
  }

  if (loading || !profile) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="py-16 text-center text-sm text-muted-foreground">Loading profile...</CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <ProfileHeader profile={profile} onUpdate={handleHeaderUpdate} isEditable={!!isOwner} />
      <ExperienceSection experiences={profile.experiences || []} onUpdate={handleExperiencesUpdate} isEditable={!!isOwner} />
      <EducationSection education={profile.education || []} onUpdate={handleEducationUpdate} isEditable={!!isOwner} />
      <WorkSection work={profile.work || []} onUpdate={handleWorkUpdate} isEditable={!!isOwner} />
      <DemoVideoSection videos={profile.demoVideos || []} onUpdate={handleVideosUpdate} isEditable={!!isOwner} />
    </div>
  )
}
