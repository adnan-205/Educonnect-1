"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { api, bookingsApi, paymentsApi } from "@/services/api"
import { useToast } from "@/hooks/use-toast"
import { Calendar, Clock, Video, User } from "lucide-react"
import { useRouter } from "next/navigation"
import { useUser } from "@clerk/nextjs"

export default function MyClassesPage() {
    const router = useRouter()
    const { isLoaded, isSignedIn, user } = useUser()
    const [classes, setClasses] = useState<any[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")
    const { toast } = useToast()
    const [paidMap, setPaidMap] = useState<Record<string, boolean>>({})

    useEffect(() => {
        const syncAndFetch = async () => {
            try {
                if (!isLoaded) return
                if (!isSignedIn) return
                let token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
                if (!token && user?.primaryEmailAddress?.emailAddress) {
                    try {
                        const email = user.primaryEmailAddress.emailAddress
                        const name = user.fullName || undefined
                        const res = await api.post('/auth/clerk-sync', { email, name })
                        const { token: t, user: backendUser } = res.data || {}
                        if (t) localStorage.setItem('token', t)
                        if (backendUser) localStorage.setItem('user', JSON.stringify(backendUser))
                    } catch {}
                }
                await loadClasses()
            } finally {}
        }
        syncAndFetch()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isLoaded, isSignedIn, user?.id])

    const loadClasses = async () => {
        try {
            setLoading(true)
            setError("")
            const res = await bookingsApi.getMyBookings()
            // Filter for accepted bookings (these are the actual classes)
            const acceptedClasses = (res?.data || []).filter((b: any) => b.status === "accepted")
            setClasses(acceptedClasses)
            // Prefetch payment status per booking for teacher visibility
            const results: Record<string, boolean> = {}
            await Promise.all(acceptedClasses.map(async (b: any) => {
                try {
                    const st = await paymentsApi.getBookingStatus(b._id)
                    results[b._id] = !!st?.paid
                } catch {
                    results[b._id] = false
                }
            }))
            setPaidMap(results)
        } catch (e: any) {
            setError(e?.response?.data?.message || "Failed to load classes")
        } finally {
            setLoading(false)
        }
    }

    const handleJoinClass = (classItem: any) => {
        const meetingLink = classItem?.meetingLink
        const meetingRoomId = classItem?.meetingRoomId
        const minutes = classItem?.gig?.duration || 90

        if (meetingRoomId) {
            router.push(`/dashboard/video-call/${meetingRoomId}?minutes=${minutes}`)
            return
        }

        if (meetingLink) {
            const roomId = (meetingLink as string).split('/').pop() || ''
            if (roomId) {
                router.push(`/dashboard/video-call/${roomId}?minutes=${minutes}`)
                return
            }
        }

        toast({
            title: "No Meeting Link",
            description: "Meeting link not available. Please contact the student.",
            variant: "destructive"
        })
    }

    const handleMarkComplete = async (bookingId: string) => {
        try {
            await bookingsApi.updateBookingStatus(bookingId, "completed")
            toast({
                title: "Success",
                description: "Class marked as completed"
            })
            loadClasses()
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to mark class as completed",
                variant: "destructive"
            })
        }
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case "completed":
                return "bg-green-100 text-green-800"
            case "ongoing":
                return "bg-blue-100 text-blue-800"
            default:
                return "bg-yellow-100 text-yellow-800"
        }
    }
    // Timer to re-evaluate join availability without heavy re-renders
    const [nowTs, setNowTs] = useState<number>(() => Date.now())
    useEffect(() => {
        const id = setInterval(() => setNowTs(Date.now()), 30000) // 30s granularity
        return () => clearInterval(id)
    }, [])

    const startTime = (bk: any) => new Date(bk?.scheduledAt || bk?.scheduledDate).getTime()
    const isJoinEnabled = (bk: any) => {
        const start = startTime(bk)
        const durationMin = bk?.gig?.duration || 90
        const windowOpen = start - 15 * 60 * 1000
        const endTs = start + durationMin * 60 * 1000
        const windowClose = endTs + 60 * 60 * 1000
        return nowTs >= windowOpen && nowTs <= windowClose
    }
    const isClassToday = (bk: any) => new Date(bk?.scheduledAt || bk?.scheduledDate).toDateString() === new Date().toDateString()
    const formatDateTime = (bk: any) => {
        const d = new Date(bk?.scheduledAt || bk?.scheduledDate)
        return {
            date: d.toLocaleDateString(),
            time: d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
    }

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="animate-pulse">
                    <div className="h-8 bg-gray-200 rounded w-48 mb-4"></div>
                    <div className="space-y-4">
                        {Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
                        ))}
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-4 sm:space-y-6">
            <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">My Classes</h1>
                <p className="text-sm sm:text-base text-gray-600 mt-2">View and manage your scheduled classes.</p>
            </div>

            {error && (
                <div className="text-center text-red-600 p-4 bg-red-50 rounded-lg">
                    {error}
                </div>
            )}

            <div className="space-y-4">
                {classes.length === 0 ? (
                    <Card className="bg-white shadow-sm border-0">
                        <CardContent className="p-12 text-center">
                            <Video className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">No classes scheduled</h3>
                            <p className="text-gray-500">Your scheduled classes will appear here.</p>
                        </CardContent>
                    </Card>
                ) : (
                    classes.map((classItem) => (
                        <Card key={classItem._id} className="bg-white shadow-sm border-0">
                            <CardContent className="p-4 sm:p-6">
                                <div className="flex flex-col sm:flex-row items-start sm:items-start justify-between gap-4">
                                    <div className="flex items-start space-x-3 sm:space-x-4 flex-1 min-w-0">
                                        <Avatar className="h-10 w-10 sm:h-12 sm:w-12 flex-shrink-0">
                                            <AvatarImage src={classItem.student?.avatar || "/placeholder.jpg"} />
                                            <AvatarFallback>
                                                {classItem.student?.name?.split(' ').map((n: string) => n[0]).join('') || 'ST'}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-semibold text-gray-900 mb-1 text-sm sm:text-base truncate">
                                                {classItem.gig?.title}
                                            </h3>
                                            <p className="text-xs sm:text-sm text-gray-600 mb-2 truncate">
                                                with {classItem.student?.name}
                                            </p>
                                            <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-500">
                                                <div className="flex items-center gap-1">
                                                    <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
                                                    {formatDateTime(classItem).date}
                                                    {isClassToday(classItem) && (
                                                        <Badge className="ml-1 sm:ml-2 bg-blue-100 text-blue-800 text-xs">Today</Badge>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
                                                    {formatDateTime(classItem).time}
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <User className="h-3 w-3 sm:h-4 sm:w-4" />
                                                    {classItem.gig?.duration} min
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <Badge className={getStatusColor(classItem.status)}>
                                                {classItem.status}
                                            </Badge>
                                            {paidMap[classItem._id] ? (
                                                <Badge className="bg-green-100 text-green-800">Paid</Badge>
                                            ) : (
                                                <Badge className="bg-yellow-100 text-yellow-800">Unpaid</Badge>
                                            )}
                                        </div>
                                        <div className="flex gap-2 w-full sm:w-auto">
                                            {classItem.status === "accepted" && (
                                                <Button
                                                    size="sm"
                                                    onClick={() => handleJoinClass(classItem)}
                                                    className={`${isJoinEnabled(classItem) 
                                                        ? 'bg-green-600 hover:bg-green-700' 
                                                        : 'bg-gray-200 text-gray-600'} flex-1 sm:flex-initial`}
                                                    disabled={!isJoinEnabled(classItem) || (!classItem.meetingLink && !classItem.meetingRoomId)}
                                                >
                                                    <Video className="h-4 w-4 mr-1" />
                                                    <span className="hidden sm:inline">{isJoinEnabled(classItem) ? 'Join Now' : 'Join Class'}</span>
                                                    <span className="sm:hidden">Join</span>
                                                </Button>
                                            )}
                                            {classItem.status === "accepted" && classItem.meetingLink && (
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => handleMarkComplete(classItem._id)}
                                                    className="flex-1 sm:flex-initial"
                                                >
                                                    <span className="hidden sm:inline">Mark Complete</span>
                                                    <span className="sm:hidden">Complete</span>
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    )
}
