"use client"

import { useState, useEffect } from "react"
import { ProfileHeader } from "@/components/profile/profile-header"
import { ExperienceSection } from "@/components/profile/experience-section"
import { EducationSection } from "@/components/profile/education-section"
import { WorkSection } from "@/components/profile/work-section"
import { DemoVideoSection } from "@/components/profile/demo-video-section"
import { usersApi } from "@/services/api"
import { useToast } from "@/hooks/use-toast"
import type { UserProfile, Experience, Education, Work, DemoVideo } from "@/lib/types/profile"

export default function ProfilePage() {
    const [profile, setProfile] = useState<UserProfile>(() => {
        const userStr = typeof window !== 'undefined' ? localStorage.getItem('user') : null
        const me = userStr ? JSON.parse(userStr) : null
        return {
            id: me?.id || 'me',
            name: me?.name || 'Your Name',
            email: me?.email || 'you@example.com',
            phone: '',
            location: '',
            bio: 'Tell students about your experience and teaching style.',
            headline: 'Teacher at EduConnect',
            userType: 'teacher',
            avatar: '',
            coverImage: '',
            experiences: [],
            education: [],
            work: [],
            skills: [],
            languages: [],
            subjects: [],
            hourlyRate: undefined,
            availability: '',
            timezone: '',
            demoVideos: []
        }
    })
    const [loading, setLoading] = useState(false)
    const { toast } = useToast()

    // Load profile from backend on mount
    useEffect(() => {
        const loadProfile = async () => {
            try {
                setLoading(true)
                const userStr = typeof window !== 'undefined' ? localStorage.getItem('user') : null
                const me = userStr ? JSON.parse(userStr) : null
                if (!me?.id) return

                const res = await usersApi.getUser(me.id)
                const userData = res?.data
                if (userData) {
                    setProfile({
                        id: userData._id || me.id,
                        name: userData.name || me.name || 'Your Name',
                        email: userData.email || me.email || 'you@example.com',
                        phone: userData.phone || '',
                        location: userData.location || '',
                        bio: userData.profile?.bio || 'Tell students about your experience and teaching style.',
                        headline: userData.headline || 'Teacher at EduConnect',
                        userType: userData.role === 'teacher' ? 'teacher' : 'student',
                        avatar: userData.avatar || '',
                        coverImage: userData.coverImage || '',
                        experiences: userData.profile?.experiences || [],
                        education: userData.profile?.education || [],
                        work: userData.profile?.work || [],
                        skills: userData.profile?.skills || [],
                        languages: userData.profile?.languages || [],
                        subjects: userData.profile?.subjects || [],
                        hourlyRate: userData.profile?.hourlyRate,
                        availability: userData.profile?.availability || '',
                        timezone: userData.profile?.timezone || '',
                        demoVideos: userData.profile?.demoVideos || []
                    })
                }
            } catch (error) {
                console.error('Failed to load profile:', error)
                toast({
                    title: "Error",
                    description: "Failed to load profile data",
                    variant: "destructive"
                })
            } finally {
                setLoading(false)
            }
        }
        loadProfile()
    }, [])

    const handleProfileUpdate = async (updates: Partial<UserProfile>) => {
        try {
            setProfile(prev => ({ ...prev, ...updates }))
            await usersApi.updateMe({
                name: updates.name,
                headline: updates.headline,
                phone: updates.phone,
                location: updates.location,
                avatar: updates.avatar,
                coverImage: updates.coverImage,
                profile: {
                    bio: updates.bio,
                    skills: updates.skills,
                    languages: updates.languages,
                    subjects: updates.subjects,
                    hourlyRate: updates.hourlyRate,
                    availability: updates.availability,
                    timezone: updates.timezone
                }
            })
            toast({
                title: "Success",
                description: "Profile updated successfully"
            })
        } catch (error) {
            console.error('Failed to update profile:', error)
            toast({
                title: "Error",
                description: "Failed to update profile",
                variant: "destructive"
            })
        }
    }

    const handleExperienceUpdate = async (experiences: Experience[]) => {
        try {
            setProfile(prev => ({ ...prev, experiences }))
            await usersApi.updateMe({
                profile: { experiences }
            })
            toast({
                title: "Success",
                description: "Experience updated successfully"
            })
        } catch (error) {
            console.error('Failed to update experiences:', error)
            toast({
                title: "Error",
                description: "Failed to update experience",
                variant: "destructive"
            })
        }
    }

    const handleEducationUpdate = async (education: Education[]) => {
        try {
            setProfile(prev => ({ ...prev, education }))
            await usersApi.updateMe({
                profile: { education }
            })
            toast({
                title: "Success",
                description: "Education updated successfully"
            })
        } catch (error) {
            console.error('Failed to update education:', error)
            toast({
                title: "Error",
                description: "Failed to update education",
                variant: "destructive"
            })
        }
    }

    const handleWorkUpdate = async (work: Work[]) => {
        try {
            setProfile(prev => ({ ...prev, work }))
            await usersApi.updateMe({
                profile: { work }
            })
            toast({
                title: "Success",
                description: "Work experience updated successfully"
            })
        } catch (error) {
            console.error('Failed to update work:', error)
            toast({
                title: "Error",
                description: "Failed to update work experience",
                variant: "destructive"
            })
        }
    }

    const handleDemoVideoUpdate = async (demoVideos: DemoVideo[]) => {
        try {
            setProfile(prev => ({ ...prev, demoVideos }))
            await usersApi.updateMe({
                profile: { demoVideos }
            })
            toast({
                title: "Success",
                description: "Demo videos updated successfully"
            })
        } catch (error) {
            console.error('Failed to update demo videos:', error)
            toast({
                title: "Error",
                description: "Failed to update demo videos",
                variant: "destructive"
            })
        }
    }

    if (loading) {
        return (
            <div className="container mx-auto px-0 md:px-4 py-4 md:py-6">
                <div className="max-w-4xl mx-auto space-y-6">
                    <div className="animate-pulse">
                        <div className="h-48 bg-gray-200 rounded-lg mb-6"></div>
                        <div className="space-y-6">
                            {Array.from({ length: 4 }).map((_, i) => (
                                <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="container mx-auto px-0 md:px-4 py-4 md:py-6">
            <div className="max-w-4xl mx-auto space-y-6">
                <ProfileHeader profile={profile} onUpdate={handleProfileUpdate} isEditable={true} />
                <div className="space-y-6">
                    <ExperienceSection experiences={profile.experiences} onUpdate={handleExperienceUpdate} isEditable={true} />
                    <WorkSection work={profile.work} onUpdate={handleWorkUpdate} isEditable={true} />
                    <EducationSection education={profile.education} onUpdate={handleEducationUpdate} isEditable={true} />
                    <DemoVideoSection videos={profile.demoVideos || []} onUpdate={handleDemoVideoUpdate} isEditable={true} />
                </div>
            </div>
        </div>
    )
}
