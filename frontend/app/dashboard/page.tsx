"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { bookingsApi, reviewsApi } from "@/services/api"
import { useToast } from "@/hooks/use-toast"
import { Calendar, Users, Clock, Star, ArrowRight, BookOpen, TrendingUp, DollarSign } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useUser } from "@clerk/nextjs"
import { Badge } from "@/components/ui/badge"

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
                } catch { }
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
            } catch { }
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
                }
            } catch (e) {
                // silent fail
            }
        }
        load()
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

    // Calculate hours this month
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const completedThisMonth = allBookings.filter((b: any) => {
        if (b.status !== "completed") return false
        const completedDate = new Date(b.completedAt || b.updatedAt || b.createdAt)
        return completedDate >= startOfMonth
    })
    const hoursThisMonth = completedThisMonth.reduce((total: number, b: any) => {
        const duration = b.gig?.duration || 60
        return total + (duration / 60)
    }, 0)

    const displayName = userName || "User"

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">
                        Welcome back, {displayName}
                    </h1>
                    <p className="text-muted-foreground mt-1 text-lg">
                        Here's an overview of your activity today.
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="hidden md:flex">
                        <Calendar className="mr-2 h-4 w-4" />
                        {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
                    </Button>
                    {role === 'student' && (
                        <Link href="/browse">
                            <Button size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm">
                                Find a Teacher
                            </Button>
                        </Link>
                    )}
                </div>
            </div>

            {/* Main Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="border-none shadow-md bg-gradient-to-br from-blue-500/10 to-blue-600/5 dark:from-blue-500/20 dark:to-blue-900/10">
                    <CardHeader className="flex flex-row items-center justify-between пространство-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Upcoming Classes
                        </CardTitle>
                        <Calendar className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{upcomingCount}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Scheduled for this week
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-md bg-gradient-to-br from-green-500/10 to-green-600/5 dark:from-green-500/20 dark:to-green-900/10">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            {role === "student" ? "My Teachers" : role === "teacher" ? "My Students" : "Total Users"}
                        </CardTitle>
                        <Users className="h-4 w-4 text-green-600 dark:text-green-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">
                            {role === "student" ? totalTeachers : role === "teacher" ? totalStudents : 0}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {role === "student" ? "Active mentors" : role === "teacher" ? "Active learners" : "Total registered"}
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-md bg-gradient-to-br from-purple-500/10 to-purple-600/5 dark:from-purple-500/20 dark:to-purple-900/10">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Time Invested
                        </CardTitle>
                        <TrendingUp className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{Math.round(hoursThisMonth * 10) / 10}h</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Learning hours this month
                        </p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Upcoming Schedule (Main Column) */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-semibold tracking-tight">Your Schedule</h2>
                        <Link href={role === 'teacher' ? '/dashboard/bookings' : '/dashboard/my-classes'} className="text-sm text-primary hover:underline flex items-center">
                            View all <ArrowRight className="h-4 w-4 ml-1" />
                        </Link>
                    </div>

                    {role === "student" ? (
                        <div className="space-y-4">
                            {studentBookings.length === 0 ? (
                                <Card className="border-dashed">
                                    <CardContent className="flex flex-col items-center justify-center py-10 text-center">
                                        <div className="bg-muted p-4 rounded-full mb-4">
                                            <Calendar className="h-8 w-8 text-muted-foreground" />
                                        </div>
                                        <h3 className="text-lg font-medium">No upcoming classes</h3>
                                        <p className="text-sm text-muted-foreground max-w-xs mx-auto mt-2 mb-6">
                                            You don't have any classes scheduled. Browse our teachers to book your first lesson!
                                        </p>
                                        <Link href="/browse">
                                            <Button>Find a Teacher</Button>
                                        </Link>
                                    </CardContent>
                                </Card>
                            ) : (
                                studentBookings.slice(0, 5).map((b: any) => (
                                    <Card key={b._id} className="overflow-hidden border-none shadow-sm hover:shadow-md transition-shadow group">
                                        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-primary/80 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        <CardContent className="p-0">
                                            <div className="flex flex-col sm:flex-row items-start sm:items-center p-5 gap-4">
                                                <div className="flex-shrink-0 bg-primary/10 text-primary rounded-xl p-3 text-center min-w-[70px]">
                                                    <div className="text-xs font-semibold uppercase">{new Date(b.scheduledDate).toLocaleDateString(undefined, { month: 'short' })}</div>
                                                    <div className="text-xl font-bold">{new Date(b.scheduledDate).getDate()}</div>
                                                </div>

                                                <div className="flex-1 space-y-1">
                                                    <div className="flex items-center justify-between">
                                                        <h3 className="font-semibold text-base">{b.gig?.title}</h3>
                                                        <Badge variant="secondary" className="font-normal text-xs">
                                                            {b.gig?.duration} min
                                                        </Badge>
                                                    </div>
                                                    <div className="flex items-center text-sm text-muted-foreground gap-2">
                                                        <Avatar className="h-5 w-5">
                                                            <AvatarImage src="/placeholder.jpg" />
                                                            <AvatarFallback className="text-[10px]">TC</AvatarFallback>
                                                        </Avatar>
                                                        <span>with {b.gig?.teacher?.name}</span>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-3 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-border/50">
                                                    <div className="flex items-center text-sm font-medium">
                                                        <Clock className="mr-1.5 h-4 w-4 text-muted-foreground" />
                                                        {b.scheduledTime}
                                                    </div>
                                                    <Button size="sm" variant="ghost" className="ml-auto sm:ml-0" asChild>
                                                        <Link href={`/dashboard/video-call/${b._id}`}>Join</Link>
                                                    </Button>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))
                            )}
                        </div>
                    ) : role === "teacher" ? (
                        <div className="space-y-4">
                            {teacherBookings.length === 0 ? (
                                <Card className="border-dashed">
                                    <CardContent className="flex flex-col items-center justify-center py-10 text-center">
                                        <div className="bg-muted p-4 rounded-full mb-4">
                                            <Calendar className="h-8 w-8 text-muted-foreground" />
                                        </div>
                                        <h3 className="text-lg font-medium">No upcoming classes</h3>
                                        <p className="text-sm text-muted-foreground mt-2">
                                            Share your profile to get more bookings!
                                        </p>
                                    </CardContent>
                                </Card>
                            ) : (
                                teacherBookings.slice(0, 5).map((b: any) => (
                                    <Card key={b._id} className="overflow-hidden border-none shadow-sm hover:shadow-md transition-shadow group">
                                        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-primary/80 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        <CardContent className="p-0">
                                            <div className="flex flex-col sm:flex-row items-center p-5 gap-4">
                                                <div className="flex-shrink-0 bg-primary/10 text-primary rounded-xl p-3 text-center min-w-[70px]">
                                                    <div className="text-xs font-semibold uppercase">{new Date(b.scheduledDate || b.scheduledAt).toLocaleDateString(undefined, { month: 'short' })}</div>
                                                    <div className="text-xl font-bold">{new Date(b.scheduledDate || b.scheduledAt).getDate()}</div>
                                                </div>

                                                <div className="flex-1 text-center sm:text-left space-y-1">
                                                    <h3 className="font-semibold text-base">{b.gig?.title}</h3>
                                                    <div className="flex items-center justify-center sm:justify-start text-sm text-muted-foreground gap-2">
                                                        <Avatar className="h-5 w-5">
                                                            <AvatarImage src={b.student?.avatar} />
                                                            <AvatarFallback className="text-[10px]">
                                                                {b.student?.name?.split(' ').map((n: string) => n[0]).join('') || 'S'}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <span>with {b.student?.name || "Student"}</span>
                                                    </div>
                                                </div>

                                                <div className="flex flex-col sm:items-end gap-1 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-border/50">
                                                    <div className="text-sm font-medium">{b.scheduledTime || ""}</div>
                                                    <div className="text-xs text-muted-foreground">{b.gig?.duration || 60} min</div>
                                                </div>
                                                <Button size="sm" className="w-full sm:w-auto" asChild>
                                                    <Link href={`/dashboard/video-call/${b._id}`}>Start Class</Link>
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))
                            )}
                        </div>
                    ) : (
                        <div className="border border-dashed rounded-lg p-8 text-center text-muted-foreground">
                            No schedule data available.
                        </div>
                    )}
                </div>

                {/* Right Column Notifications & Actions */}
                <div className="space-y-6">
                    {/* Pending Reviews Widget */}
                    {role === "student" && pendingReviews.length > 0 && (
                        <Card className="bg-yellow-50/50 dark:bg-yellow-900/10 border-yellow-200/50 dark:border-yellow-900/20 shadow-sm">
                            <CardHeader className="pb-3">
                                <CardTitle className="flex items-center gap-2 text-base text-yellow-700 dark:text-yellow-500">
                                    <Star className="h-5 w-5 fill-yellow-500 text-yellow-500" />
                                    Review Pending
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {pendingReviews.slice(0, 3).map((p) => (
                                    <div key={`${p.gigId}-${p.bookingId}`} className="bg-background rounded-lg p-3 shadow-sm border border-border/50">
                                        <div className="font-medium text-sm truncate">{p.title}</div>
                                        <div className="text-xs text-muted-foreground mb-2">with {p.teacher}</div>
                                        <Link href={`/gigs/${p.gigId}`}>
                                            <Button size="sm" variant="secondary" className="w-full h-8 text-xs">
                                                Write Review
                                            </Button>
                                        </Link>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    )}

                    {/* Quick Profile Card */}
                    <Card className="border-none shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-base">Your Profile Status</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="h-2 flex-1 bg-secondary rounded-full overflow-hidden">
                                    <div className="h-full bg-green-500 w-[85%] rounded-full" />
                                </div>
                                <span className="text-xs font-medium text-muted-foreground">85%</span>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Complete your profile to get better recommendations.
                            </p>
                            <Button variant="outline" size="sm" className="w-full" asChild>
                                <Link href="/dashboard/profile">Edit Profile</Link>
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Promo / Tip Card */}
                    <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl p-5 text-white shadow-lg">
                        <h3 className="font-bold text-lg mb-2">Did you know?</h3>
                        <p className="text-indigo-100 text-sm mb-4">
                            You can sync your dashboard schedule with your Google Calendar.
                        </p>
                        <Button size="sm" variant="secondary" className="w-full bg-white/10 hover:bg-white/20 text-white border-0">
                            Sync Calendar
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}
