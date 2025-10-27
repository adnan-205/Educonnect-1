"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { bookingsApi, reviewsApi } from "@/services/api"
import { useToast } from "@/hooks/use-toast"
import { Calendar, Users, Clock, Star } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

// Mock data for demonstration
const upcomingClasses = [
    {
        id: 1,
        teacher: "Sarah Johnson",
        subject: "Calculus",
        time: "Today, 2:00 PM",
        duration: "60 min",
        avatar: "/placeholder.jpg"
    },
    {
        id: 2,
        teacher: "David Chen",
        subject: "Python Programming",
        time: "Tomorrow, 10:00 AM",
        duration: "90 min",
        avatar: "/placeholder.jpg"
    }
]

export default function DashboardPage() {
    const [role, setRole] = useState<"student" | "teacher" | "admin" | null>(null)
    const [studentBookings, setStudentBookings] = useState<any[]>([])
    const [pendingReviews, setPendingReviews] = useState<any[]>([])
    const { toast } = useToast()

    useEffect(() => {
        if (typeof window !== "undefined") {
            let r = localStorage.getItem("role") as any
            if (!r) {
                try {
                    const uStr = localStorage.getItem('user')
                    if (uStr) {
                        const u = JSON.parse(uStr)
                        if (u?.role) r = u.role
                    }
                } catch {}
            }
            setRole(r)
        }
    }, [])

    useEffect(() => {
        const load = async () => {
            if (role !== "student") return
            try {
                const res = await bookingsApi.getMyBookings()
                const all = (res?.data || []) as any[]
                const list = all.filter((b: any) => b.status === "accepted")
                setStudentBookings(list)

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
            } catch (e) {
                // silent fail keeps mock UI
            }
        }
        load()
    }, [role])

    // Periodic polling to detect newly completed classes and pending reviews (every 60s)
    useEffect(() => {
        if (role !== 'student') return
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
    }, [role])

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Welcome back, John!</h1>
                <p className="text-gray-600 mt-2">Here's what's happening with your education journey today.</p>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-white shadow-sm border-0">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Upcoming Classes</p>
                                <p className="text-2xl font-bold text-gray-900">3</p>
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
                                <p className="text-sm font-medium text-gray-600">Total Teachers</p>
                                <p className="text-2xl font-bold text-gray-900">12</p>
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
                                <p className="text-2xl font-bold text-gray-900">24</p>
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
                                    <div key={`${p.gigId}-${p.bookingId}`} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                                        <div>
                                            <div className="font-semibold text-gray-900">{p.title}</div>
                                            <div className="text-sm text-gray-600">with {p.teacher}</div>
                                        </div>
                                        <Link href={`/gigs/${p.gigId}`}>
                                            <Button className="bg-yellow-500 hover:bg-yellow-600 text-black">
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
                                    <div key={b._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                        <div className="flex items-center space-x-4">
                                            <Avatar className="h-12 w-12">
                                                <AvatarImage src="/placeholder.jpg" />
                                                <AvatarFallback>TC</AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <h3 className="font-semibold text-gray-900">{b.gig?.title}</h3>
                                                <p className="text-sm text-gray-600">with {b.gig?.teacher?.name}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-medium text-gray-900">{new Date(b.scheduledDate).toLocaleDateString()} {b.scheduledTime}</p>
                                            <p className="text-sm text-gray-500">{b.gig?.duration} min</p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {upcomingClasses.map((classItem) => (
                                <div key={classItem.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                    <div className="flex items-center space-x-4">
                                        <Avatar className="h-12 w-12">
                                            <AvatarImage src={classItem.avatar} />
                                            <AvatarFallback>{classItem.teacher.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <h3 className="font-semibold text-gray-900">{classItem.subject}</h3>
                                            <p className="text-sm text-gray-600">with {classItem.teacher}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-medium text-gray-900">{classItem.time}</p>
                                        <p className="text-sm text-gray-500">{classItem.duration}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
