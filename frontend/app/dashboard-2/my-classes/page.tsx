"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { bookingsApi } from "@/services/api"
import { useToast } from "@/hooks/use-toast"
import { Calendar, Clock, Video, User } from "lucide-react"

export default function MyClassesPage() {
    const [classes, setClasses] = useState<any[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")
    const { toast } = useToast()

    useEffect(() => {
        loadClasses()
    }, [])

    const loadClasses = async () => {
        try {
            setLoading(true)
            setError("")
            const res = await bookingsApi.getMyBookings()
            // Filter for accepted bookings (these are the actual classes)
            const acceptedClasses = (res?.data || []).filter((b: any) => b.status === "accepted")
            setClasses(acceptedClasses)
        } catch (e: any) {
            setError(e?.response?.data?.message || "Failed to load classes")
        } finally {
            setLoading(false)
        }
    }

    const handleJoinClass = (classId: string) => {
        // In a real app, this would open the video call interface
        toast({
            title: "Joining Class",
            description: "Opening video call interface..."
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

    const isClassToday = (date: string) => {
        const classDate = new Date(date).toDateString()
        const today = new Date().toDateString()
        return classDate === today
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
                <h1 className="text-3xl font-bold text-gray-900">My Classes</h1>
                <p className="text-gray-600 mt-2">View and manage your scheduled classes.</p>
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
                            <CardContent className="p-6">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-start space-x-4">
                                        <Avatar className="h-12 w-12">
                                            <AvatarImage src={classItem.student?.avatar || "/placeholder.jpg"} />
                                            <AvatarFallback>
                                                {classItem.student?.name?.split(' ').map((n: string) => n[0]).join('') || 'ST'}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1">
                                            <h3 className="font-semibold text-gray-900 mb-1">
                                                {classItem.gig?.title}
                                            </h3>
                                            <p className="text-sm text-gray-600 mb-2">
                                                with {classItem.student?.name}
                                            </p>
                                            <div className="flex items-center gap-4 text-sm text-gray-500">
                                                <div className="flex items-center gap-1">
                                                    <Calendar className="h-4 w-4" />
                                                    {new Date(classItem.scheduledDate).toLocaleDateString()}
                                                    {isClassToday(classItem.scheduledDate) && (
                                                        <Badge className="ml-2 bg-blue-100 text-blue-800">Today</Badge>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <Clock className="h-4 w-4" />
                                                    {classItem.scheduledTime}
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <User className="h-4 w-4" />
                                                    {classItem.gig?.duration} min
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Badge className={getStatusColor(classItem.status)}>
                                            {classItem.status}
                                        </Badge>
                                        <div className="flex gap-2">
                                            {isClassToday(classItem.scheduledDate) && classItem.status === "accepted" && (
                                                <Button
                                                    size="sm"
                                                    onClick={() => handleJoinClass(classItem._id)}
                                                    className="bg-blue-600 hover:bg-blue-700"
                                                >
                                                    <Video className="h-4 w-4 mr-1" />
                                                    Join Class
                                                </Button>
                                            )}
                                            {classItem.status === "accepted" && (
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => handleMarkComplete(classItem._id)}
                                                >
                                                    Mark Complete
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
