"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { bookingsApi, usersApi } from "@/services/api"
import {
    Search,
    Star,
    MessageCircle,
    Calendar,
    Video,
    User,
    BookOpen,
    Clock,
    Mail,
    Phone
} from "lucide-react"

interface Teacher {
    _id: string
    name: string
    email: string
    profileImage?: string
    bio?: string
    rating?: number
    totalReviews?: number
    totalClasses?: number
    subjects?: string[]
    experience?: string
    education?: string
}

interface TeacherRelation {
    teacher: Teacher
    totalBookings: number
    completedClasses: number
    upcomingClasses: number
    lastClassDate?: string
    nextClassDate?: string
}

export default function MyTeachersPage() {
    const [teachers, setTeachers] = useState<TeacherRelation[]>([])
    const [filteredTeachers, setFilteredTeachers] = useState<TeacherRelation[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")
    const { toast } = useToast()

    useEffect(() => {
        fetchMyTeachers()
    }, [])

    useEffect(() => {
        filterTeachers()
    }, [teachers, searchTerm])

    const fetchMyTeachers = async () => {
        try {
            // Get all bookings for the current student
            const bookingsResponse = await bookingsApi.getMyBookings()
            const bookings = bookingsResponse.data

            // Group bookings by teacher
            const teacherMap = new Map<string, any>()

            for (const booking of bookings) {
                const teacherId = booking.gig?.teacher?._id
                if (!teacherId) continue

                if (!teacherMap.has(teacherId)) {
                    teacherMap.set(teacherId, {
                        teacher: booking.gig.teacher,
                        totalBookings: 0,
                        completedClasses: 0,
                        upcomingClasses: 0,
                        lastClassDate: null,
                        nextClassDate: null,
                        bookings: []
                    })
                }

                const teacherData = teacherMap.get(teacherId)
                teacherData.totalBookings++
                teacherData.bookings.push(booking)

                const classDate = new Date(booking.scheduledDate)
                const now = new Date()

                if (booking.status === "completed") {
                    teacherData.completedClasses++
                    if (!teacherData.lastClassDate || classDate > new Date(teacherData.lastClassDate)) {
                        teacherData.lastClassDate = booking.scheduledDate
                    }
                } else if (booking.status === "accepted" && classDate > now) {
                    teacherData.upcomingClasses++
                    if (!teacherData.nextClassDate || classDate < new Date(teacherData.nextClassDate)) {
                        teacherData.nextClassDate = booking.scheduledDate
                    }
                }
            }

            // Bulk fetch all teacher details in a single request instead of N+1
            const teacherIds = Array.from(teacherMap.keys())
            let detailedTeacherMap = new Map<string, any>()
            if (teacherIds.length > 0) {
                try {
                    const bulkRes = await usersApi.getUsersBulk(teacherIds)
                    const bulkUsers = bulkRes?.data || []
                    for (const u of bulkUsers) {
                        detailedTeacherMap.set(String(u._id), u)
                    }
                } catch {
                    // fallback: use basic teacher info from bookings
                }
            }

            const teacherRelations: TeacherRelation[] = []
            for (const [teacherId, data] of teacherMap) {
                const detailedTeacher = detailedTeacherMap.get(teacherId)
                if (detailedTeacher) {
                    teacherRelations.push({
                        teacher: {
                            ...data.teacher,
                            ...detailedTeacher,
                            // Use actual teacher stats from API, no random fallbacks
                            rating: detailedTeacher.teacherRatingAverage || detailedTeacher.rating || 0,
                            totalReviews: detailedTeacher.teacherReviewsCount || detailedTeacher.totalReviews || 0,
                            // Show actual completed classes with this student (not random total)
                            totalClasses: data.completedClasses,
                            subjects: detailedTeacher.subjects || detailedTeacher.profile?.subjects || [],
                            experience: detailedTeacher.experience || detailedTeacher.profile?.experiences?.[0]?.title || ""
                        },
                        totalBookings: data.totalBookings,
                        completedClasses: data.completedClasses,
                        upcomingClasses: data.upcomingClasses,
                        lastClassDate: data.lastClassDate,
                        nextClassDate: data.nextClassDate
                    })
                } else {
                    // Fallback: use basic teacher info from bookings without random fallbacks
                    teacherRelations.push({
                        teacher: {
                            ...data.teacher,
                            rating: data.teacher?.teacherRatingAverage || data.teacher?.rating || 0,
                            totalReviews: data.teacher?.teacherReviewsCount || data.teacher?.totalReviews || 0,
                            totalClasses: data.completedClasses,
                            subjects: data.teacher?.subjects || data.teacher?.profile?.subjects || [],
                            experience: data.teacher?.experience || data.teacher?.profile?.experiences?.[0]?.title || ""
                        },
                        totalBookings: data.totalBookings,
                        completedClasses: data.completedClasses,
                        upcomingClasses: data.upcomingClasses,
                        lastClassDate: data.lastClassDate,
                        nextClassDate: data.nextClassDate
                    })
                }
            }

            setTeachers(teacherRelations)
        } catch (error) {
            console.error("Error fetching teachers:", error)
            toast({
                title: "Error",
                description: "Failed to load your teachers. Please try again.",
                variant: "destructive"
            })
        } finally {
            setLoading(false)
        }
    }

    const filterTeachers = () => {
        let filtered = teachers

        if (searchTerm) {
            filtered = filtered.filter(relation =>
                relation.teacher.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                relation.teacher.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                relation.teacher.subjects?.some(subject =>
                    subject.toLowerCase().includes(searchTerm.toLowerCase())
                )
            )
        }

        // Sort by total classes (most active first)
        filtered.sort((a, b) => b.completedClasses - a.completedClasses)

        setFilteredTeachers(filtered)
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString()
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading your teachers...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">My Teachers</h1>
                    <p className="text-gray-600 mt-1">Manage your relationships with teachers and track your learning progress</p>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                    <User className="h-4 w-4" />
                    <span>{filteredTeachers.length} teachers</span>
                </div>
            </div>

            {/* Search */}
            <Card>
                <CardContent className="p-6">
                    <div className="relative max-w-md">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <Input
                            placeholder="Search teachers by name, email, or subject..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Teachers List */}
            {filteredTeachers.length === 0 ? (
                <Card>
                    <CardContent className="p-12 text-center">
                        <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">No teachers found</h3>
                        <p className="text-gray-600 mb-4">
                            {teachers.length === 0
                                ? "You haven't taken any classes yet. Book your first class to start learning!"
                                : "No teachers match your search criteria."
                            }
                        </p>
                        {teachers.length === 0 && (
                            <Button>
                                <BookOpen className="h-4 w-4 mr-2" />
                                Browse Classes
                            </Button>
                        )}
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {filteredTeachers.map((relation) => (
                        <Card key={relation.teacher._id} className="hover:shadow-lg transition-shadow">
                            <CardHeader className="pb-4">
                                <div className="flex items-start gap-4">
                                    <Avatar className="h-16 w-16">
                                        <AvatarImage src={relation.teacher.profileImage} />
                                        <AvatarFallback className="text-lg">
                                            {relation.teacher.name.split(' ').map(n => n[0]).join('')}
                                        </AvatarFallback>
                                    </Avatar>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <h3 className="text-lg font-semibold text-gray-900 truncate">
                                                    {relation.teacher.name}
                                                </h3>
                                                <p className="text-sm text-gray-500">{relation.teacher.email}</p>
                                            </div>
                                            <div className="flex items-center gap-1 text-sm text-yellow-600">
                                                <Star className="h-4 w-4 fill-current" />
                                                {(relation.teacher.rating ?? 0) > 0 ? (
                                                    <>
                                                        <span>{(relation.teacher.rating ?? 0).toFixed(1)}</span>
                                                        <span className="text-gray-500">({relation.teacher.totalReviews ?? 0} reviews)</span>
                                                    </>
                                                ) : (
                                                    <span className="text-gray-400">No reviews yet</span>
                                                )}
                                            </div>
                                        </div>

                                        {relation.teacher.subjects && (
                                            <div className="flex flex-wrap gap-1 mt-2">
                                                {relation.teacher.subjects.slice(0, 3).map((subject, index) => (
                                                    <Badge key={index} variant="secondary" className="text-xs">
                                                        {subject}
                                                    </Badge>
                                                ))}
                                                {relation.teacher.subjects.length > 3 && (
                                                    <Badge variant="secondary" className="text-xs">
                                                        +{relation.teacher.subjects.length - 3} more
                                                    </Badge>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </CardHeader>

                            <CardContent className="space-y-4">
                                {/* Stats */}
                                <div className="grid grid-cols-3 gap-4 text-center">
                                    <div className="bg-blue-50 p-3 rounded-lg">
                                        <div className="text-2xl font-bold text-blue-600">{relation.completedClasses}</div>
                                        <div className="text-xs text-gray-600">Completed</div>
                                    </div>
                                    <div className="bg-green-50 p-3 rounded-lg">
                                        <div className="text-2xl font-bold text-green-600">{relation.upcomingClasses}</div>
                                        <div className="text-xs text-gray-600">Upcoming</div>
                                    </div>
                                    <div className="bg-purple-50 p-3 rounded-lg">
                                        <div className="text-2xl font-bold text-purple-600">{relation.totalBookings}</div>
                                        <div className="text-xs text-gray-600">Total Classes</div>
                                    </div>
                                </div>

                                {/* Class Dates */}
                                <div className="space-y-2 text-sm">
                                    {relation.lastClassDate && (
                                        <div className="flex items-center gap-2 text-gray-600">
                                            <Clock className="h-4 w-4" />
                                            <span>Last class: {formatDate(relation.lastClassDate)}</span>
                                        </div>
                                    )}
                                    {relation.nextClassDate && (
                                        <div className="flex items-center gap-2 text-green-600">
                                            <Calendar className="h-4 w-4" />
                                            <span>Next class: {formatDate(relation.nextClassDate)}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Bio */}
                                {relation.teacher.bio && (
                                    <p className="text-sm text-gray-600 line-clamp-2">
                                        {relation.teacher.bio}
                                    </p>
                                )}

                                {/* Action Buttons */}
                                <div className="flex gap-2 pt-2 border-t">
                                    <Button size="sm" className="flex-1">
                                        <MessageCircle className="h-4 w-4 mr-2" />
                                        Message
                                    </Button>
                                    <Button size="sm" variant="outline" className="flex-1">
                                        <Calendar className="h-4 w-4 mr-2" />
                                        Book Class
                                    </Button>
                                    <Button size="sm" variant="ghost">
                                        <User className="h-4 w-4" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )
}
