"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { bookingsApi, reviewsApi } from "@/services/api"
import { useToast } from "@/hooks/use-toast"
import { Calendar, Users, Clock, Star } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useUser } from "@clerk/nextjs"

export default function DashboardPage() {
    const [role, setRole] = useState<"student" | "teacher" | "admin" | null>(null)
    const [studentBookings, setStudentBookings] = useState<any[]>([])
    const [teacherBookings, setTeacherBookings] = useState<any[]>([])
    const [allBookings, setAllBookings] = useState<any[]>([])
    const [pendingReviews, setPendingReviews] = useState<any[]>([])
    const [userName, setUserName] = useState<string>("")
    const { toast } = useToast()
    const { isLoaded: clerkLoaded, isSignedIn, user: clerkUser } = useUser()

    useEffect(() => {
        if (typeof window !== "undefined") {
            let r = localStorage.getItem("role") as any
            if (!r) {
                try {
                    const uStr = localStorage.getItem('user')
                    if (uStr) {
                        const u = JSON.parse(uStr)
                        if (u?.role) r = u.role
                        if (u?.name) setUserName(u.name)
                    }
                } catch {}
            } else {
                setRole(r)
            }
            // Get user name from localStorage or Clerk
            try {
                const uStr = localStorage.getItem('user')
                if (uStr) {
                    const u = JSON.parse(uStr)
                    if (u?.name) setUserName(u.name)
                }
            } catch {}
            if (!userName && clerkUser) {
                setUserName(clerkUser.fullName || clerkUser.firstName || clerkUser.username || "User")
            }
        }
    }, [clerkUser, userName])

    useEffect(() => {
        const load = async () => {
            if (!clerkLoaded || !isSignedIn) return
            try {
                const res = await bookingsApi.getMyBookings()
                const all = (res?.data || []) as any[]
                setAllBookings(all)
                
                if (role === "student") {
                    // For students: get accepted bookings that are upcoming
                    const now = new Date()
                    const upcoming = all.filter((b: any) => {
                        if (b.status !== "accepted") return false
                        const scheduledDate = new Date(b.scheduledDate || b.scheduledAt)
                        return scheduledDate >= now
                    })
                    setStudentBookings(upcoming)
                } else if (role === "teacher") {
                    // For teachers: get accepted bookings that are upcoming
                    const now = new Date()
                    const upcoming = all.filter((b: any) => {
                        if (b.status !== "accepted") return false
                        const scheduledDate = new Date(b.scheduledDate || b.scheduledAt)
                        return scheduledDate >= now
                    })
                    setTeacherBookings(upcoming)
                }

                // Student notifications for status changes
                if (typeof window !== "undefined") {
                    const key = "booking_status_notifications"
                    let cache: Record<string, string> = {}
                    try {
                        cache = JSON.parse(localStorage.getItem(key) || "{}")
                    } catch {}
                    const updated = { ...cache }
                    for (const b of all) {
                        if ((b.status === "accepted" || b.status === "rejected" || b.status === "completed") && updated[b._id] !== b.status) {
                            toast({
                                title: b.status === "accepted" ? "Booking accepted" : b.status === "rejected" ? "Booking rejected" : "Class completed",
                                description: b.status === "accepted"
                                    ? `Your booking for "${b.gig?.title}" was accepted by ${b.gig?.teacher?.name}.`
                                    : b.status === "rejected"
                                    ? `Your booking for "${b.gig?.title}" was rejected.`
                                    : `Please leave a review for "${b.gig?.title}".`,
                            })
                            updated[b._id] = b.status
                        }
                    }
                    localStorage.setItem(key, JSON.stringify(updated))
                }

                if (role === "student") {
                    const completed = all.filter((b: any) => b.status === "completed" && b.gig?._id)
                const uniqueGigIds = Array.from(new Set(completed.map((b: any) => String(b.gig._id))))
                const results = await Promise.all(uniqueGigIds.map(async (gid) => {
                    try {
                        const mine = await reviewsApi.getMyReviewForGig(gid)
                        return { gigId: gid, hasReview: !!mine?.data }
                    } catch {
                        return { gigId: gid, hasReview: false }
                    }
                }))
                const noReviewGigs = new Set(results.filter(r => !r.hasReview).map(r => r.gigId))
                const pending = completed
                  .filter((b: any) => noReviewGigs.has(String(b.gig._id)))
                  .map((b: any) => ({
                    bookingId: b._id,
                    gigId: b.gig._id,
                    title: b.gig.title,
                    teacher: b.gig.teacher?.name,
                  }))
                setPendingReviews(pending)

                if (typeof window !== 'undefined' && pending.length > 0) {
                    const key = 'review_notifications'
                    let cache: Record<string, boolean> = {}
                    try { cache = JSON.parse(localStorage.getItem(key) || '{}') } catch {}
                    const updated: Record<string, boolean> = { ...cache }
                    for (const p of pending) {
                        if (!updated[p.gigId]) {
                            toast({ title: 'Please review your class', description: `Share feedback for "${p.title}".` })
                            updated[p.gigId] = true
                        }
                    }
                    localStorage.setItem(key, JSON.stringify(updated))
                }
                }
            } catch (e) {
                // silent fail keeps mock UI
            }
        }
        load()
    }, [role, clerkLoaded, isSignedIn])

    // Periodic polling to detect newly completed classes and pending reviews (every 60s)
    useEffect(() => {
        if (role !== 'student' || !clerkLoaded || !isSignedIn) return
        const id = setInterval(async () => {
            try {
                const res = await bookingsApi.getMyBookings()
                const all = (res?.data || []) as any[]
                const completed = all.filter((b: any) => b.status === 'completed' && b.gig?._id)
                const uniqueGigIds = Array.from(new Set(completed.map((b: any) => String(b.gig._id))))
                const results = await Promise.all(uniqueGigIds.map(async (gid) => {
                    try {
                        const mine = await reviewsApi.getMyReviewForGig(gid)
                        return { gigId: gid, hasReview: !!mine?.data }
                    } catch {
                        return { gigId: gid, hasReview: false }
                    }
                }))
                const noReviewGigs = new Set(results.filter(r => !r.hasReview).map(r => r.gigId))
                const pending = completed
                    .filter((b: any) => noReviewGigs.has(String(b.gig._id)))
                    .map((b: any) => ({ bookingId: b._id, gigId: b.gig._id, title: b.gig.title, teacher: b.gig.teacher?.name }))
                setPendingReviews(pending)

                if (typeof window !== 'undefined' && pending.length > 0) {
                    const key = 'review_notifications'
                    let cache: Record<string, boolean> = {}
                    try { cache = JSON.parse(localStorage.getItem(key) || '{}') } catch {}
                    const updated: Record<string, boolean> = { ...cache }
                    for (const p of pending) {
                        if (!updated[p.gigId]) {
                            toast({ title: 'Please review your class', description: `Share feedback for "${p.title}".` })
                            updated[p.gigId] = true
                        }
                    }
                    localStorage.setItem(key, JSON.stringify(updated))
                }
            } catch {}
        }, 60000)
        return () => clearInterval(id)
    }, [role, clerkLoaded, isSignedIn])

    // Calculate stats
    const upcomingCount = role === "student" ? studentBookings.length : role === "teacher" ? teacherBookings.length : 0
    
    // Calculate total teachers (for students) or total students (for teachers)
    const uniqueTeachers = new Set<string>()
    const uniqueStudents = new Set<string>()
    allBookings.forEach((b: any) => {
        if (b.gig?.teacher?._id) uniqueTeachers.add(String(b.gig.teacher._id))
        if (b.student?._id) uniqueStudents.add(String(b.student._id))
    })
    const totalTeachers = uniqueTeachers.size
    const totalStudents = uniqueStudents.size

    // Calculate hours this month from completed bookings
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const completedThisMonth = allBookings.filter((b: any) => {
        if (b.status !== "completed") return false
        const completedDate = new Date(b.completedAt || b.updatedAt || b.createdAt)
        return completedDate >= startOfMonth
    })
    const hoursThisMonth = completedThisMonth.reduce((total: number, b: any) => {
        const duration = b.gig?.duration || 60 // default to 60 minutes if not specified
        return total + (duration / 60) // convert minutes to hours
    }, 0)

    const displayName = userName || "User"

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Welcome back, {displayName}!</h1>
                <p className="text-sm sm:text-base text-gray-600 mt-2">Here's what's happening with your education journey today.</p>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                <Card className="bg-white shadow-sm border-0">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Upcoming Classes</p>
                                <p className="text-2xl font-bold text-gray-900">{upcomingCount}</p>
                            </div>
                            <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                <Calendar className="h-6 w-6 text-blue-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-white shadow-sm border-0">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">
                                    {role === "student" ? "Total Teachers" : role === "teacher" ? "Total Students" : "Total Users"}
                                </p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {role === "student" ? totalTeachers : role === "teacher" ? totalStudents : 0}
                                </p>
                            </div>
                            <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                                <Users className="h-6 w-6 text-green-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-white shadow-sm border-0">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Hours This Month</p>
                                <p className="text-2xl font-bold text-gray-900">{Math.round(hoursThisMonth * 10) / 10}</p>
                            </div>
                            <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                                <Clock className="h-6 w-6 text-purple-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Upcoming Classes */}
            {role === "student" && (
                <Card className="bg-white shadow-sm border-0">
                    <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                            <Star className="h-5 w-5 text-yellow-500" />
                            <span>Pending Reviews</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {pendingReviews.length === 0 ? (
                            <div className="text-sm text-gray-500">No pending reviews.</div>
                        ) : (
                            <div className="space-y-3">
                                {pendingReviews.map((p) => (
                                    <div key={`${p.gigId}-${p.bookingId}`} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                                        <div className="flex-1 min-w-0">
                                            <div className="font-semibold text-gray-900 truncate">{p.title}</div>
                                            <div className="text-sm text-gray-600">with {p.teacher}</div>
                                        </div>
                                        <Link href={`/gigs/${p.gigId}`} className="w-full sm:w-auto">
                                            <Button className="bg-yellow-500 hover:bg-yellow-600 text-black w-full sm:w-auto">
                                                <Star className="h-4 w-4 mr-2" />
                                                Review now
                                            </Button>
                                        </Link>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}
            <Card className="bg-white shadow-sm border-0">
                <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                        <Calendar className="h-5 w-5 text-blue-600" />
                        <span>Upcoming Classes</span>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {role === "student" ? (
                        <div className="space-y-4">
                            {studentBookings.length === 0 ? (
                                <div className="text-sm text-gray-500">No upcoming classes yet.</div>
                            ) : (
                                studentBookings.slice(0, 5).map((b: any) => (
                                    <div key={b._id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 p-4 bg-gray-50 rounded-lg">
                                        <div className="flex items-center space-x-3 sm:space-x-4 flex-1 min-w-0">
                                            <Avatar className="h-10 w-10 sm:h-12 sm:w-12 flex-shrink-0">
                                                <AvatarImage src="/placeholder.jpg" />
                                                <AvatarFallback>TC</AvatarFallback>
                                            </Avatar>
                                            <div className="min-w-0 flex-1">
                                                <h3 className="font-semibold text-gray-900 truncate text-sm sm:text-base">{b.gig?.title}</h3>
                                                <p className="text-xs sm:text-sm text-gray-600 truncate">with {b.gig?.teacher?.name}</p>
                                            </div>
                                        </div>
                                        <div className="text-left sm:text-right w-full sm:w-auto">
                                            <p className="font-medium text-gray-900 text-sm sm:text-base">{new Date(b.scheduledDate).toLocaleDateString()} {b.scheduledTime}</p>
                                            <p className="text-xs sm:text-sm text-gray-500">{b.gig?.duration} min</p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    ) : role === "teacher" ? (
                        <div className="space-y-4">
                            {teacherBookings.length === 0 ? (
                                <div className="text-sm text-gray-500">No upcoming classes yet.</div>
                            ) : (
                                teacherBookings.slice(0, 5).map((b: any) => (
                                    <div key={b._id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 p-4 bg-gray-50 rounded-lg">
                                        <div className="flex items-center space-x-3 sm:space-x-4 flex-1 min-w-0">
                                            <Avatar className="h-10 w-10 sm:h-12 sm:w-12 flex-shrink-0">
                                                <AvatarImage src={b.student?.avatar} />
                                                <AvatarFallback>
                                                    {b.student?.name?.split(' ').map((n: string) => n[0]).join('') || 'S'}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="min-w-0 flex-1">
                                                <h3 className="font-semibold text-gray-900 truncate text-sm sm:text-base">{b.gig?.title}</h3>
                                                <p className="text-xs sm:text-sm text-gray-600 truncate">with {b.student?.name || "Student"}</p>
                                            </div>
                                        </div>
                                        <div className="text-left sm:text-right w-full sm:w-auto">
                                            <p className="font-medium text-gray-900 text-sm sm:text-base">
                                                {new Date(b.scheduledDate || b.scheduledAt).toLocaleDateString()} {b.scheduledTime || ""}
                                            </p>
                                            <p className="text-xs sm:text-sm text-gray-500">{b.gig?.duration || 60} min</p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    ) : (
                        <div className="text-sm text-gray-500">No upcoming classes.</div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
