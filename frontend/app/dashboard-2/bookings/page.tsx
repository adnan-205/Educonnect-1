"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { api, bookingsApi, paymentsApi } from "@/services/api"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { Calendar, Clock, User, CheckCircle, XCircle, Video } from "lucide-react"
import { useUser } from "@clerk/nextjs"

export default function BookingsPage() {
    const router = useRouter()
    const { isLoaded, isSignedIn, user } = useUser()
    const [bookings, setBookings] = useState<any[]>([])
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
                await loadBookings()
            } finally {}
        }
        syncAndFetch()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isLoaded, isSignedIn, user?.id])

    const loadBookings = async () => {
        try {
            setLoading(true)
            setError("")
            const res = await bookingsApi.getMyBookings()
            const list = res?.data || []
            setBookings(list)
            // Prefetch paid status for accepted bookings
            const accepted = list.filter((b: any) => b.status === "accepted")
            const results: Record<string, boolean> = {}
            await Promise.all(accepted.map(async (b: any) => {
                try {
                    const st = await paymentsApi.getBookingStatus(b._id)
                    results[b._id] = !!st?.paid
                } catch {
                    results[b._id] = false
                }
            }))
            setPaidMap(results)
        } catch (e: any) {
            setError(e?.response?.data?.message || "Failed to load bookings")
        } finally {
            setLoading(false)
        }
    }

    const handleAccept = async (bookingId: string) => {
        try {
            await bookingsApi.updateBookingStatus(bookingId, "accepted")
            toast({
                title: "Success",
                description: "Booking accepted successfully"
            })
            loadBookings()
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to accept booking",
                variant: "destructive"
            })
        }
    }

    const handleReject = async (bookingId: string) => {
        try {
            await bookingsApi.updateBookingStatus(bookingId, "rejected")
            toast({
                title: "Success",
                description: "Booking rejected"
            })
            loadBookings()
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to reject booking",
                variant: "destructive"
            })
        }
    }

    // Route to embedded meeting page for accepted bookings
    const handleJoinAccepted = (booking: any) => {
        const minutes = booking?.gig?.duration || 90
        if (booking?.meetingRoomId) {
            router.push(`/dashboard-2/video-call/${booking.meetingRoomId}?minutes=${minutes}`)
            return
        }
        if (booking?.meetingLink) {
            const roomId = (booking.meetingLink as string).split('/').pop() || ''
            if (roomId) {
                router.push(`/dashboard-2/video-call/${roomId}?minutes=${minutes}`)
                return
            }
        }
        toast({
            title: "No Meeting Link",
            description: "Meeting link not available yet.",
            variant: "destructive"
        })
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case "accepted":
                return "bg-green-100 text-green-800"
            case "rejected":
                return "bg-red-100 text-red-800"
            case "completed":
                return "bg-blue-100 text-blue-800"
            default:
                return "bg-yellow-100 text-yellow-800"
        }
    }

    // Lightweight timer and helpers for timezone-accurate join gating
    const [nowTs, setNowTs] = useState<number>(() => Date.now())
    useEffect(() => {
        const id = setInterval(() => setNowTs(Date.now()), 30000) // 30s
        return () => clearInterval(id)
    }, [])

    const startTime = (bk: any) => new Date(bk?.scheduledAt || bk?.scheduledDate).getTime()
    const isJoinEnabled = (bk: any) => nowTs >= startTime(bk)
    const formatDateTime = (bk: any) => {
        const d = new Date(bk?.scheduledAt || bk?.scheduledDate)
        return {
            date: d.toLocaleDateString(),
            time: d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
    }

    // Split bookings into sections
    const requestBookings = bookings.filter((b) => b.status === "pending")
    const acceptedBookings = bookings.filter((b) => b.status === "accepted")
    const rejectedBookings = bookings.filter((b) => b.status === "rejected")

    // Reusable booking item card to reduce duplication
    const BookingItem = ({ booking, right }: { booking: any; right?: any }) => (
        <Card className="bg-white shadow-sm border-0">
            <CardContent className="p-6">
                <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4">
                        <Avatar className="h-12 w-12">
                            <AvatarImage src={booking.student?.avatar || "/placeholder.jpg"} />
                            <AvatarFallback>
                                {booking.student?.name?.split(' ').map((n: string) => n[0]).join('') || 'ST'}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                            <h3 className="font-semibold text-gray-900 mb-1">{booking.gig?.title}</h3>
                            <p className="text-sm text-gray-600 mb-2">Student: {booking.student?.name}</p>
                            <div className="flex items-center gap-4 text-sm text-gray-500">
                                <div className="flex items-center gap-1">
                                    <Calendar className="h-4 w-4" />
                                    {formatDateTime(booking).date}
                                </div>
                                <div className="flex items-center gap-1">
                                    <Clock className="h-4 w-4" />
                                    {formatDateTime(booking).time}
                                </div>
                                <div className="flex items-center gap-1">
                                    <User className="h-4 w-4" />
                                    {booking.gig?.duration} min
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        {right ?? (
                            <Badge className={getStatusColor(booking.status)}>{booking.status}</Badge>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    )

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
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Bookings</h1>
                <p className="text-gray-600 mt-2">Manage your class bookings and requests.</p>
            </div>

            {error && (
                <div className="text-center text-red-600 p-4 bg-red-50 rounded-lg">{error}</div>
            )}

            {/* 1) Requests (Pending) with serial numbers */}
            <section className="space-y-3">
                <Card className="border-0 shadow-none">
                    <CardHeader className="px-0 pt-0">
                        <CardTitle className="text-xl">Requests</CardTitle>
                    </CardHeader>
                </Card>
                {requestBookings.length === 0 ? (
                    <Card className="bg-white shadow-sm border-0">
                        <CardContent className="p-6 text-center text-gray-600">No pending requests</CardContent>
                    </Card>
                ) : (
                    requestBookings.map((booking, idx) => (
                        <BookingItem
                            key={booking._id}
                            booking={booking}
                            right={
                                <div className="flex items-center gap-3">
                                    <span className="text-xs text-gray-500">#{idx + 1}</span>
                                    <div className="flex gap-2">
                                        <Button
                                            size="sm"
                                            onClick={() => handleAccept(booking._id)}
                                            className="bg-green-600 hover:bg-green-700"
                                        >
                                            <CheckCircle className="h-4 w-4 mr-1" />
                                            Accept
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => handleReject(booking._id)}
                                            className="text-red-600 border-red-600 hover:bg-red-50"
                                        >
                                            <XCircle className="h-4 w-4 mr-1" />
                                            Reject
                                        </Button>
                                    </div>
                                </div>
                            }
                        />
                    ))
                )}
            </section>

            {/* 2) Accepted Bookings */}
            <section className="space-y-3">
                <Card className="border-0 shadow-none">
                    <CardHeader className="px-0 pt-0">
                        <CardTitle className="text-xl">Accepted Bookings</CardTitle>
                    </CardHeader>
                </Card>
                {acceptedBookings.length === 0 ? (
                    <Card className="bg-white shadow-sm border-0">
                        <CardContent className="p-6 text-center text-gray-600">No accepted bookings</CardContent>
                    </Card>
                ) : (
                    acceptedBookings.map((booking) => (
                        <BookingItem
                            key={booking._id}
                            booking={booking}
                            right={
                                <div className="flex items-center gap-2">
                                    <Badge className={getStatusColor(booking.status)}>{booking.status}</Badge>
                                    {paidMap[booking._id] ? (
                                        <Badge className="bg-green-100 text-green-800">Paid</Badge>
                                    ) : (
                                        <Badge className="bg-yellow-100 text-yellow-800">Unpaid</Badge>
                                    )}
                                    <Button
                                        size="sm"
                                        onClick={() => handleJoinAccepted(booking)}
                                        className={`${isJoinEnabled(booking) ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-200 text-gray-600'}`}
                                        disabled={!isJoinEnabled(booking) || (!booking?.meetingLink && !booking?.meetingRoomId)}
                                    >
                                        <Video className="h-4 w-4 mr-1" />
                                        {isJoinEnabled(booking) ? 'Join Now' : 'Join Class'}
                                    </Button>
                                </div>
                            }
                        />
                    ))
                )}
            </section>

            {/* 3) Rejected Bookings */}
            <section className="space-y-3">
                <Card className="border-0 shadow-none">
                    <CardHeader className="px-0 pt-0">
                        <CardTitle className="text-xl">Rejected Bookings</CardTitle>
                    </CardHeader>
                </Card>
                {rejectedBookings.length === 0 ? (
                    <Card className="bg-white shadow-sm border-0">
                        <CardContent className="p-6 text-center text-gray-600">No rejected bookings</CardContent>
                    </Card>
                ) : (
                    rejectedBookings.map((booking) => (
                        <BookingItem key={booking._id} booking={booking} />
                    ))
                )}
            </section>
        </div>
    )
}
