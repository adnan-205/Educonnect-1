"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { bookingsApi, paymentsApi } from "@/services/api"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
    Video,
    Clock,
    Calendar,
    User,
    ExternalLink,
    Search,
    Play
} from "lucide-react"
import PaymentButton from "@/components/PaymentButton"

interface Booking {
    _id: string
    gig: {
        _id: string
        title: string
        description: string
        category: string
        duration: number
        price?: number
        teacher: {
            _id: string
            name: string
            email: string
            profileImage?: string
        }
    }
    student: {
        _id: string
        name: string
        email: string
    }
    scheduledDate: string
    scheduledAt?: string
    timeZone?: string
    status: "pending" | "accepted" | "completed" | "rejected"
    meetingLink?: string
    meetingRoomId?: string
    notes?: string
    createdAt: string
}

export default function JoinClassPage() {
    const router = useRouter()
    const [bookings, setBookings] = useState<Booking[]>([])
    const [filteredBookings, setFilteredBookings] = useState<Booking[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")
    const [selectedStatus, setSelectedStatus] = useState("all")
    const { toast } = useToast()
    // Track payment status per gig for current student
    const [paidMap, setPaidMap] = useState<Record<string, boolean>>({})

    useEffect(() => {
        fetchBookings()
    }, [])

    useEffect(() => {
        filterBookings()
    }, [bookings, searchTerm, selectedStatus])

    // Lightweight timer to re-evaluate join availability without heavy re-renders
    const [nowTs, setNowTs] = useState<number>(() => Date.now())
    useEffect(() => {
        const id = setInterval(() => setNowTs(Date.now()), 30000) // 30s is enough granularity
        return () => clearInterval(id)
    }, [])

    const fetchBookings = async () => {
        try {
            const response = await bookingsApi.getMyBookings()
            setBookings(response.data)
            // After loading bookings, prefetch payment status for accepted gigs
            const accepted = (response.data || []).filter((b: Booking) => b.status === "accepted")
            const uniqueGigIds = Array.from(new Set(accepted.map((b: Booking) => b.gig._id)))
            const results: Record<string, boolean> = {}
            for (const gid of uniqueGigIds) {
                try {
                    const st = await paymentsApi.getStatus(gid)
                    results[gid] = !!st?.paid
                } catch {
                    // if status check fails, consider unpaid to be safe
                    results[gid] = false
                }
            }
            setPaidMap(results)
        } catch (error) {
            console.error("Error fetching bookings:", error)
            toast({
                title: "Error",
                description: "Failed to load your classes. Please try again.",
                variant: "destructive"
            })
        } finally {
            setLoading(false)
        }
    }

    const filterBookings = () => {
        let filtered = bookings

        // Search filter
        if (searchTerm) {
            const q = searchTerm.toLowerCase()
            filtered = filtered.filter(booking =>
                booking.gig.title.toLowerCase().includes(q) ||
                booking.gig.teacher.name.toLowerCase().includes(q) ||
                (booking.gig.category ? booking.gig.category.toLowerCase().includes(q) : false)
            )
        }

        // Status filter
        if (selectedStatus !== "all") {
            filtered = filtered.filter(booking => booking.status === selectedStatus)
        }

        // Sort by start time (prefer scheduledAt if available)
        const getStart = (bk: Booking) => new Date(bk.scheduledAt || bk.scheduledDate).getTime()
        filtered.sort((a, b) => getStart(a) - getStart(b))

        setFilteredBookings(filtered)
    }

    const handleJoinClass = (booking: Booking) => {
        const minutes = booking.gig?.duration || 90
        // Require successful payment before allowing to join (student side)
        const paid = paidMap[booking.gig._id] === true
        if (!paid) {
            toast({
                title: "Payment Required",
                description: "Please complete the payment to join this class.",
                variant: "destructive"
            })
            return
        }
        if (booking.meetingRoomId) {
            router.push(`/dashboard-2/video-call/${booking.meetingRoomId}?minutes=${minutes}`)
            return
        }
        if (booking.meetingLink) {
            const roomId = booking.meetingLink.split('/').pop() || ''
            if (roomId) {
                router.push(`/dashboard-2/video-call/${roomId}?minutes=${minutes}`)
                return
            }
        }
        toast({
            title: "No Meeting Link",
            description: "The teacher hasn't provided a meeting link yet. Please contact them directly.",
            variant: "destructive"
        })
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case "accepted":
                return "bg-green-100 text-green-800"
            case "pending":
                return "bg-yellow-100 text-yellow-800"
            case "completed":
                return "bg-blue-100 text-blue-800"
            case "rejected":
                return "bg-red-100 text-red-800"
            default:
                return "bg-gray-100 text-gray-800"
        }
    }

    const isJoinEnabled = (bk: Booking) => {
        const start = new Date(bk.scheduledAt || bk.scheduledDate).getTime()
        const timeOk = nowTs >= start
        const paid = paidMap[bk.gig._id] === true
        return timeOk && paid // must be paid and time reached
    }

    const formatDateTime = (bk: Booking) => {
        const date = new Date(bk.scheduledAt || bk.scheduledDate)
        return {
            date: date.toLocaleDateString(),
            time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading your classes...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Join Class</h1>
                    <p className="text-gray-600 mt-1">Access your scheduled classes and join live sessions</p>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Video className="h-4 w-4" />
                    <span>{filteredBookings.length} classes scheduled</span>
                </div>
            </div>

            {/* Search and Filters */}
            <Card>
                <CardContent className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                            <Input
                                placeholder="Search classes or teachers..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                        
                        <select
                            value={selectedStatus}
                            onChange={(e) => setSelectedStatus(e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="all">All Status</option>
                            <option value="accepted">Accepted</option>
                            <option value="pending">Pending</option>
                            <option value="completed">Completed</option>
                            <option value="rejected">Rejected</option>
                        </select>

                        <Button variant="outline" className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            View Calendar
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Classes List */}
            {filteredBookings.length === 0 ? (
                <Card>
                    <CardContent className="p-12 text-center">
                        <Video className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">No classes scheduled</h3>
                        <p className="text-gray-600 mb-4">You don't have any classes scheduled yet.</p>
                        <Link href="/dashboard-2/book-classes">
                            <Button>
                                <ExternalLink className="h-4 w-4 mr-2" />
                                Book a Class
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-4">
                    {filteredBookings.map((booking) => {
                        const { date, time } = formatDateTime(booking)
                        const canJoin = booking.status === "accepted" && isJoinEnabled(booking)
                        const isPaid = paidMap[booking.gig._id] === true
                        
                        return (
                            <Card key={booking._id} className={`${canJoin ? 'ring-2 ring-green-500 bg-green-50' : ''}`}>
                                <CardContent className="p-6">
                                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                                        {/* Class Info */}
                                        <div className="flex-1 space-y-3">
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <h3 className="text-lg font-semibold text-gray-900">
                                                        {booking.gig.title}
                                                    </h3>
                                                    {booking.gig.category && (
                                                        <Badge variant="secondary" className="mt-1">
                                                            {booking.gig.category}
                                                        </Badge>
                                                    )}
                                                </div>
                                                <Badge className={getStatusColor(booking.status)}>
                                                    {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                                                </Badge>
                                            </div>

                                            {/* Teacher Info */}
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-10 w-10">
                                                    <AvatarImage src={booking.gig.teacher.profileImage} />
                                                    <AvatarFallback>
                                                        {booking.gig.teacher.name.split(' ').map(n => n[0]).join('')}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <p className="font-medium">{booking.gig.teacher.name}</p>
                                                    <p className="text-sm text-gray-500">{booking.gig.teacher.email}</p>
                                                </div>
                                            </div>

                                            {/* Class Details */}
                                            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                                                <div className="flex items-center gap-1">
                                                    <Calendar className="h-4 w-4" />
                                                    <span>{date}</span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <Clock className="h-4 w-4" />
                                                    <span>{time}</span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <Video className="h-4 w-4" />
                                                    <span>{booking.gig.duration} minutes</span>
                                                </div>
                                            </div>

                                            {booking.notes && (
                                                <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                                                    <strong>Notes:</strong> {booking.notes}
                                                </p>
                                            )}
                                        </div>

                                        {/* Action Buttons */}
                                        <div className="flex flex-col gap-2 min-w-[200px]">
                                            {canJoin && (
                                                <div className="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded-full text-center mb-2">
                                                    Class starting soon!
                                                </div>
                                            )}
                                            
                                            {booking.status === "accepted" && (
                                                <Button
                                                    onClick={() => handleJoinClass(booking)}
                                                    className={`flex items-center gap-2 ${canJoin ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-200 text-gray-600'}`}
                                                    disabled={!canJoin || (!booking.meetingLink && !booking.meetingRoomId)}
                                                >
                                                    <Play className="h-4 w-4" />
                                                    {canJoin ? "Join Now" : "Join Class"}
                                                </Button>
                                            )}
                                            
                                            {booking.status === "accepted" && !isPaid && (
                                                <PaymentButton gigId={booking.gig._id} amount={booking.gig as any && (booking as any).gig?.price ? (booking as any).gig.price : 0} />
                                            )}
                                            
                                            {booking.status === "pending" && (
                                                <Button variant="outline" disabled>
                                                    <Clock className="h-4 w-4 mr-2" />
                                                    Waiting for Confirmation
                                                </Button>
                                            )}
                                            
                                            {booking.status === "completed" && (
                                                <Button variant="outline" disabled>
                                                    <Video className="h-4 w-4 mr-2" />
                                                    Class Completed
                                                </Button>
                                            )}
                                            
                                            <Button variant="ghost" size="sm">
                                                <User className="h-4 w-4 mr-2" />
                                                Contact Teacher
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
