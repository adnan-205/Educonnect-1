"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { bookingsApi } from "@/services/api"
import { useToast } from "@/hooks/use-toast"
import { Users, Star, Clock, MessageCircle, Calendar } from "lucide-react"

export default function StudentsPage() {
    const [students, setStudents] = useState<any[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")
    const { toast } = useToast()

    useEffect(() => {
        loadStudents()
    }, [])

    const loadStudents = async () => {
        try {
            setLoading(true)
            setError("")
            const res = await bookingsApi.getMyBookings()
            // Extract unique students from bookings
            const bookings = res?.data || []
            const uniqueStudents = bookings.reduce((acc: any[], booking: any) => {
                if (booking.student && !acc.find(s => s._id === booking.student._id)) {
                    const studentBookings = bookings.filter((b: any) => b.student?._id === booking.student._id)
                    const completedClasses = studentBookings.filter((b: any) => b.status === "completed").length
                    const lastClass = studentBookings
                        .filter((b: any) => b.status === "completed")
                        .sort((a: any, b: any) => new Date(b.scheduledDate).getTime() - new Date(a.scheduledDate).getTime())[0]
                    
                    acc.push({
                        ...booking.student,
                        totalBookings: studentBookings.length,
                        completedClasses,
                        lastClass: lastClass?.scheduledDate,
                        subjects: [...new Set(studentBookings.map((b: any) => b.gig?.category).filter(Boolean))],
                        rating: 4.5 + Math.random() * 0.5 // Mock rating
                    })
                }
                return acc
            }, [])
            setStudents(uniqueStudents)
        } catch (e: any) {
            setError(e?.response?.data?.message || "Failed to load students")
        } finally {
            setLoading(false)
        }
    }

    const handleMessageStudent = (studentId: string) => {
        toast({
            title: "Opening Messages",
            description: "Redirecting to message interface..."
        })
        // In a real app, this would open the messaging interface
    }

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="animate-pulse">
                    <div className="h-8 bg-gray-200 rounded w-48 mb-4"></div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <div key={i} className="h-64 bg-gray-200 rounded-lg"></div>
                        ))}
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">My Students</h1>
                <p className="text-gray-600 mt-2">View and manage your student relationships.</p>
            </div>

            {error && (
                <div className="text-center text-red-600 p-4 bg-red-50 rounded-lg">
                    {error}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {students.length === 0 ? (
                    <div className="col-span-full">
                        <Card className="bg-white shadow-sm border-0">
                            <CardContent className="p-12 text-center">
                                <Users className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                                <h3 className="text-lg font-medium text-gray-900 mb-2">No students yet</h3>
                                <p className="text-gray-500">Your students will appear here once they book your classes.</p>
                            </CardContent>
                        </Card>
                    </div>
                ) : (
                    students.map((student) => (
                        <Card key={student._id} className="bg-white shadow-sm border-0 hover:shadow-md transition-shadow">
                            <CardHeader className="pb-3">
                                <div className="flex items-center space-x-3">
                                    <Avatar className="h-12 w-12">
                                        <AvatarImage src={student.avatar || "/placeholder.jpg"} />
                                        <AvatarFallback>
                                            {student.name?.split(' ').map((n: string) => n[0]).join('') || 'ST'}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1">
                                        <CardTitle className="text-lg">{student.name}</CardTitle>
                                        <div className="flex items-center gap-1 mt-1">
                                            <Star className="h-4 w-4 text-yellow-500 fill-current" />
                                            <span className="text-sm text-gray-600">{student.rating?.toFixed(1)}</span>
                                        </div>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-0">
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-gray-600">Classes Completed</span>
                                        <span className="font-semibold">{student.completedClasses}</span>
                                    </div>
                                    
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-gray-600">Total Bookings</span>
                                        <span className="font-semibold">{student.totalBookings}</span>
                                    </div>
                                    
                                    {student.lastClass && (
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-gray-600">Last Class</span>
                                            <span className="font-semibold">
                                                {new Date(student.lastClass).toLocaleDateString()}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {student.subjects && student.subjects.length > 0 && (
                                    <div className="mt-4">
                                        <p className="text-sm text-gray-600 mb-2">Subjects</p>
                                        <div className="flex flex-wrap gap-1">
                                            {student.subjects.slice(0, 3).map((subject: string, index: number) => (
                                                <Badge key={index} variant="secondary" className="text-xs">
                                                    {subject}
                                                </Badge>
                                            ))}
                                            {student.subjects.length > 3 && (
                                                <Badge variant="secondary" className="text-xs">
                                                    +{student.subjects.length - 3} more
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                )}

                                <div className="mt-4 pt-4 border-t border-gray-100">
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="w-full"
                                        onClick={() => handleMessageStudent(student._id)}
                                    >
                                        <MessageCircle className="h-4 w-4 mr-2" />
                                        Send Message
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    )
}
