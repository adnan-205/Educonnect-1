"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { bookingsApi } from "@/services/api"
import { useToast } from "@/hooks/use-toast"
import { Calendar, Clock, User, CheckCircle, XCircle } from "lucide-react"

export default function BookingsPage() {
    const [bookings, setBookings] = useState<any[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")
    const { toast } = useToast()

    useEffect(() => {
        loadBookings()
    }, [])

    const loadBookings = async () => {
        try {
            setLoading(true)
            setError("")
            const res = await bookingsApi.getMyBookings()
            setBookings(res?.data || [])
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
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Bookings</h1>
                <p className="text-gray-600 mt-2">Manage your class bookings and requests.</p>
            </div>

            {error && (
                <div className="text-center text-red-600 p-4 bg-red-50 rounded-lg">
                    {error}
                </div>
            )}

            <div className="space-y-4">
                {bookings.length === 0 ? (
                    <Card className="bg-white shadow-sm border-0">
                        <CardContent className="p-12 text-center">
                            <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">No bookings yet</h3>
                            <p className="text-gray-500">Your booking requests will appear here.</p>
                        </CardContent>
                    </Card>
                ) : (
                    bookings.map((booking) => (
                        <Card key={booking._id} className="bg-white shadow-sm border-0">
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
                                            <h3 className="font-semibold text-gray-900 mb-1">
                                                {booking.gig?.title}
                                            </h3>
                                            <p className="text-sm text-gray-600 mb-2">
                                                Student: {booking.student?.name}
                                            </p>
                                            <div className="flex items-center gap-4 text-sm text-gray-500">
                                                <div className="flex items-center gap-1">
                                                    <Calendar className="h-4 w-4" />
                                                    {new Date(booking.scheduledDate).toLocaleDateString()}
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <Clock className="h-4 w-4" />
                                                    {booking.scheduledTime}
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <User className="h-4 w-4" />
                                                    {booking.gig?.duration} min
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Badge className={getStatusColor(booking.status)}>
                                            {booking.status}
                                        </Badge>
                                        {booking.status === "pending" && (
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
                                        )}
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
