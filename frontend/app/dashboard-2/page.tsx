"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useUser } from "@clerk/nextjs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { gigsApi, bookingsApi, uploadsApi } from "@/services/api"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { ProfileHeader } from "@/components/profile/profile-header"
import { ExperienceSection } from "@/components/profile/experience-section"
import { EducationSection } from "@/components/profile/education-section"
import { WorkSection } from "@/components/profile/work-section"
import { DemoVideoSection } from "@/components/profile/demo-video-section"
import type { UserProfile, Experience, Education, Work, DemoVideo } from "@/lib/types/profile"

import {
    Home,
    BookOpen,
    Users,
    MessageCircle,
    DollarSign,
    Settings,
    Calendar,
    Star,
    TrendingUp,
    Clock,
    Search,
    Filter,
    Video,
    User
} from "lucide-react"

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

const recommendedTeachers = [
    {
        id: 1,
        name: "Maria Garcia",
        subject: "Spanish",
        rating: 4.9,
        students: 45,
        price: "$25/hr",
        avatar: "/placeholder.jpg"
    },
    {
        id: 2,
        name: "Alex Kim",
        subject: "Physics",
        rating: 4.8,
        students: 32,
        price: "$30/hr",
        avatar: "/placeholder.jpg"
    }
]

const earningsData = [
    { month: "Jan", earnings: 1200 },
    { month: "Feb", earnings: 1800 },
    { month: "Mar", earnings: 1500 },
    { month: "Apr", earnings: 2200 },
    { month: "May", earnings: 1900 },
    { month: "Jun", earnings: 2400 }
]

// Teacher-specific mock data
const pendingBookings = [
    {
        id: 1,
        student: "Emma Wilson",
        subject: "Calculus",
        date: "Tomorrow, 3:00 PM",
        duration: "60 min",
        price: 25,
        avatar: "/placeholder.jpg"
    },
    {
        id: 2,
        student: "Michael Brown",
        subject: "Physics",
        date: "Friday, 2:00 PM",
        duration: "90 min",
        price: 30,
        avatar: "/placeholder.jpg"
    }
]

const upcomingTeacherClasses = [
    {
        id: 1,
        student: "Sarah Johnson",
        subject: "Calculus",
        date: "Today, 2:00 PM",
        duration: "60 min",
        status: "confirmed",
        avatar: "/placeholder.jpg"
    },
    {
        id: 2,
        student: "David Chen",
        subject: "Python Programming",
        date: "Tomorrow, 10:00 AM",
        duration: "90 min",
        status: "confirmed",
        avatar: "/placeholder.jpg"
    }
]

const teacherGigs = [
    {
        id: 1,
        title: "Advanced Mathematics Tutoring",
        subject: "Mathematics",
        price: 25,
        status: "active",
        students: 12,
        rating: 4.9
    },
    {
        id: 2,
        title: "Python Programming for Beginners",
        subject: "Computer Science",
        price: 30,
        status: "active",
        students: 8,
        rating: 4.8
    }
]

const myStudents = [
    {
        id: 1,
        name: "Emma Wilson",
        subject: "Calculus",
        classesCompleted: 15,
        lastClass: "2 days ago",
        rating: 4.9,
        avatar: "/placeholder.jpg"
    },
    {
        id: 2,
        name: "Michael Brown",
        subject: "Physics",
        classesCompleted: 8,
        lastClass: "1 week ago",
        rating: 4.8,
        avatar: "/placeholder.jpg"
    }
]

export default function DashboardPage() {
    const [activeSection, setActiveSection] = useState("home")
    const [userType, setUserType] = useState<"student" | "teacher" | "admin" | null>(null)
    const router = useRouter()
    const { isLoaded, isSignedIn } = useUser()

    // Auth + role guard: must be signed in and have a role set
    useEffect(() => {
        if (!isLoaded) return
        if (!isSignedIn) {
            router.replace("/sign-in")
            return
        }
        const role = typeof window !== "undefined" ? localStorage.getItem("role") : null
        if (!role) {
            router.replace("/role-selection")
            return
        }
    }, [isLoaded, isSignedIn, router])

    // Get user type from localStorage (same as navbar)
    useEffect(() => {
        if (typeof window !== "undefined") {
            const role = localStorage.getItem("role") as "student" | "teacher" | null
            setUserType(role)

            // Listen for storage changes (e.g., login/logout in another tab)
            const handleStorage = () => {
                const newRole = localStorage.getItem("role") as "student" | "teacher" | null
                setUserType(newRole)
            }
            window.addEventListener("storage", handleStorage)
            return () => window.removeEventListener("storage", handleStorage)
        }
    }, [])

    const navigationItems = userType === "teacher" ? [
        { id: "home", label: "Dashboard", icon: Home },
        { id: "profile", label: "Profile", icon: User },
        { id: "bookings", label: "Bookings", icon: BookOpen },
        { id: "my-classes", label: "My Classes", icon: Video },
        { id: "students", label: "My Students", icon: Users },
        { id: "gigs", label: "My Gigs", icon: Star },
        { id: "earnings", label: "Earnings", icon: DollarSign },
        { id: "messages", label: "Messages", icon: MessageCircle },
        { id: "settings", label: "Settings", icon: Settings }
    ] : userType === "admin" ? [
        { id: "home", label: "Admin Dashboard", icon: Home },
        { id: "users", label: "User Management", icon: Users },
        { id: "transactions", label: "Transactions", icon: DollarSign },
        { id: "classes", label: "Class Analytics", icon: Video },
        { id: "reports", label: "Reports", icon: TrendingUp },
        { id: "settings", label: "Settings", icon: Settings }
    ] : [
        { id: "home", label: "Home", icon: Home },
        { id: "book-classes", label: "Book Classes", icon: BookOpen },
        { id: "join-class", label: "Join Class", icon: Video },
        { id: "my-teachers", label: "My Teachers", icon: Users },
        { id: "messages", label: "Messages", icon: MessageCircle },
        { id: "settings", label: "Settings", icon: Settings }
    ]

    const renderContent = () => {
        if (userType === "teacher") {
            switch (activeSection) {
                case "home":
                    return <TeacherDashboardView />
                case "bookings":
                    return <BookingsView />
                case "my-classes":
                    return <MyClassesView />
                case "students":
                    return <StudentsView />
                case "gigs":
                    return <GigsView />
                case "earnings":
                    return <TeacherEarningsView />
                case "messages":
                    return <MessagesView />
                case "settings":
                    return <SettingsView />
                case "profile":
                    return <ProfileView />
                default:
                    return <TeacherDashboardView />
            }
        } else if (userType === "admin") {
            switch (activeSection) {
                case "home":
                    return <AdminDashboardView />
                case "users":
                    return <UserManagementView />
                case "transactions":
                    return <TransactionsView />
                case "classes":
                    return <ClassAnalyticsView />
                case "reports":
                    return <ReportsView />
                case "settings":
                    return <SettingsView />
                default:
                    return <AdminDashboardView />
            }
        } else {
            switch (activeSection) {
                case "home":
                    return <HomeView />
                case "book-classes":
                    return <BookClassesView />
                case "join-class":
                    return <JoinClassView />
                case "my-teachers":
                    return <MyTeachersView />
                case "messages":
                    return <MessagesView />
                case "settings":
                    return <SettingsView />
                default:
                    return <HomeView />
            }
        }
    }

    // Show loading state while determining user type
    if (userType === null) {
        return (
            <div className="flex h-screen bg-gray-50 items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading dashboard...</p>
                </div>
            </div>
        )
    }

    // Fallback UI while redirecting (no inline role toggle here)
    if (!userType) {
        return (
            <div className="flex h-screen bg-gray-50 items-center justify-center">
                <div className="text-center text-gray-600">Redirecting...</div>
            </div>
        )
    }

    return (
        <div className="flex flex-col lg:flex-row h-screen bg-gray-50">
            {/* Mobile Header */}
            <div className="lg:hidden bg-white border-b border-gray-200 p-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <Avatar className="h-10 w-10">
                            <AvatarImage src="/placeholder.jpg" />
                            <AvatarFallback className="text-sm font-semibold">JD</AvatarFallback>
                        </Avatar>
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900">John Doe</h2>
                            <p className="text-sm text-gray-500 capitalize">{userType}</p>
                        </div>
                    </div>
                    <button
                        onClick={() => {
                            localStorage.removeItem("role")
                            setUserType(null)
                            router.push("/")
                        }}
                        className="text-red-600 hover:text-red-700 text-sm font-medium"
                    >
                        Sign Out
                    </button>
                </div>
            </div>

            {/* Mobile Navigation */}
            <div className="lg:hidden bg-gray-50 border-b border-gray-200 p-2">
                <div className="flex overflow-x-auto space-x-2 pb-2">
                    {navigationItems.map((item) => {
                        const Icon = item.icon
                        const isActive = activeSection === item.id
                        return (
                            <button
                                key={item.id}
                                onClick={() => setActiveSection(item.id)}
                                className={`flex-shrink-0 flex flex-col items-center space-y-1 px-3 py-2 rounded-lg text-xs transition-all ${isActive
                                    ? "bg-blue-600 text-white"
                                    : "text-gray-600 hover:bg-gray-100"
                                    }`}
                            >
                                <Icon className={`h-5 w-5 ${isActive ? "text-white" : "text-gray-500"}`} />
                                <span className="font-medium whitespace-nowrap">{item.label}</span>
                            </button>
                        )
                    })}
                </div>
            </div>

            {/* Left Sidebar - Hidden on Mobile */}
            <div className="hidden lg:flex w-55 bg-gray-50 border-r border-gray-200 flex-col">
                {/* Profile Header */}
                <div className="p-6 border-b border-gray-200">
                    <div className="text-center">
                        <button
                            onClick={() => setActiveSection("settings")}
                            className="group transition-transform hover:scale-105"
                        >
                            <Avatar className="h-16 w-16 mx-auto mb-3 group-hover:ring-2 group-hover:ring-blue-300 transition-all">
                                <AvatarImage src="/placeholder.jpg" />
                                <AvatarFallback className="text-lg font-semibold">JD</AvatarFallback>
                            </Avatar>
                            <h2 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                                John Doe
                            </h2>
                            <p className="text-sm text-gray-500 capitalize">{userType}</p>
                        </button>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 p-4 space-y-2">
                    {navigationItems.map((item) => {
                        const Icon = item.icon
                        const isActive = activeSection === item.id

                        return (
                            <button
                                key={item.id}
                                onClick={() => setActiveSection(item.id)}
                                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-all duration-200 ${isActive
                                    ? "bg-blue-600 text-white shadow-sm"
                                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                                    }`}
                            >
                                <Icon className={`h-5 w-5 ${isActive ? "text-white" : "text-gray-500"}`} />
                                <span className="font-medium">{item.label}</span>
                            </button>
                        )
                    })}
                </nav>

                {/* Sign Out Button */}
                <div className="p-4 border-t border-gray-200">
                    <button
                        onClick={() => {
                            localStorage.removeItem("role")
                            setUserType(null)
                            router.push("/")
                        }}
                        className="w-full text-sm text-red-600 hover:text-red-700 hover:bg-red-50 px-4 py-2 rounded-lg transition-colors font-medium"
                    >
                        Sign Out
                    </button>
                </div>
            </div>

            {/* Right Content Panel */}
            <div className="flex-1 overflow-auto">
                <div className="p-4 lg:p-8">
                    {renderContent()}
                </div>
            </div>
        </div>
    )
}

// Home View Component
function HomeView() {
    const [role, setRole] = useState<"student" | "teacher" | "admin" | null>(null)
    const [studentBookings, setStudentBookings] = useState<any[]>([])
    const { toast } = useToast()

    useEffect(() => {
        if (typeof window !== "undefined") {
            const r = localStorage.getItem("role") as any
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
                        if ((b.status === "accepted" || b.status === "rejected") && updated[b._id] !== b.status) {
                            toast({
                                title: b.status === "accepted" ? "Booking accepted" : "Booking rejected",
                                description:
                                    b.status === "accepted"
                                        ? `Your booking for "${b.gig?.title}" was accepted by ${b.gig?.teacher?.name}.`
                                        : `Your booking for "${b.gig?.title}" was rejected.`,
                            })
                            updated[b._id] = b.status
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

// Book Classes View Component
function BookClassesView() {
    const [gigs, setGigs] = useState<any[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")
    const [searchQuery, setSearchQuery] = useState("")
    const [priceRange, setPriceRange] = useState("all")
    const router = useRouter()

    useEffect(() => {
        const load = async () => {
            try {
                setLoading(true)
                setError("")
                const res = await gigsApi.getAllGigs()
                // API returns { success, count, data }
                setGigs(res.data || [])
            } catch (e: any) {
                setError(e?.response?.data?.message || "Failed to load gigs")
            } finally {
                setLoading(false)
            }
        }
        load()
    }, [])

    const filtered = gigs.filter((gig: any) => {
        const matchesSearch =
            gig.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            gig.teacher?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            gig.category?.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesPrice =
            priceRange === "all" ||
            (priceRange === "under25" && gig.price < 25) ||
            (priceRange === "25-35" && gig.price >= 25 && gig.price <= 35) ||
            (priceRange === "over35" && gig.price > 35)
        return matchesSearch && matchesPrice
    })

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Book Classes</h1>
                <p className="text-gray-600 mt-2">Find and book classes with expert teachers.</p>
            </div>

            <Card className="bg-white shadow-sm border-0">
                <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search for teachers or subjects..."
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                        </div>
                        <Select value={priceRange} onValueChange={setPriceRange}>
                            <SelectTrigger className="w-full md:w-40">
                                <SelectValue placeholder="Price Range" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Prices</SelectItem>
                                <SelectItem value="under25">Under $25</SelectItem>
                                <SelectItem value="25-35">$25 - $35</SelectItem>
                                <SelectItem value="over35">Over $35</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {error && (
                <div className="text-center text-red-600">{error}</div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                    Array.from({ length: 6 }).map((_, i) => (
                        <Card key={i} className="bg-white shadow-sm border-0">
                            <CardContent className="p-6">
                                <div className="h-24 bg-gray-100 animate-pulse rounded" />
                            </CardContent>
                        </Card>
                    ))
                ) : filtered.length === 0 ? (
                    <div className="col-span-full text-center text-muted-foreground py-12">
                        No gigs found.
                    </div>
                ) : (
                    filtered.map((gig: any) => (
                        <Card key={gig._id} className="bg-white shadow-sm border-0 hover:shadow-md transition-shadow">
                            <CardContent className="p-6">
                                <div className="text-center">
                                    <Avatar className="h-20 w-20 mx-auto mb-4">
                                        <AvatarImage src={gig.thumbnailUrl || "/placeholder.jpg"} />
                                        <AvatarFallback>{gig.teacher?.name?.split(' ').map((n: string) => n[0]).join('') || 'TC'}</AvatarFallback>
                                    </Avatar>
                                    <h3 className="font-semibold text-gray-900 mb-1">{gig.title}</h3>
                                    <p className="text-sm text-gray-600 mb-3">by {gig.teacher?.name}</p>
                                    <div className="flex items-center justify-center gap-6 mb-4 text-sm text-muted-foreground">
                                        <span>${gig.price}/hr</span>
                                        <span>{gig.duration} min</span>
                                        <span>{gig.category}</span>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            variant="outline"
                                            className="w-full"
                                            onClick={() => {
                                                const id = gig.teacher?._id
                                                if (id) router.push(`/teachers/${id}`)
                                            }}
                                        >
                                            View Profile
                                        </Button>
                                        <Link href={`/book/${gig._id}`}>
                                            <Button className="w-full">Book Now</Button>
                                        </Link>
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
// cleaned stray block

// Join Class View Component
function JoinClassView() {
    const [role, setRole] = useState<"student" | "teacher" | "admin" | null>(null)
    const [acceptedBookings, setAcceptedBookings] = useState<any[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")
    const router = useRouter()

    useEffect(() => {
        if (typeof window !== "undefined") {
            setRole(localStorage.getItem("role") as any)
        }
    }, [])

    useEffect(() => {
        const load = async () => {
            if (role !== "student") return
            try {
                setLoading(true)
                const res = await bookingsApi.getMyBookings()
                setAcceptedBookings((res?.data || []).filter((b: any) => b.status === 'accepted'))
            } catch (e: any) {
                setError(e?.response?.data?.message || 'Failed to load bookings')
            } finally {
                setLoading(false)
            }
        }
        load()
    }, [role])

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Join Class</h1>
                <p className="text-gray-600 mt-2">Join your scheduled classes or enter class codes.</p>
            </div>

            <Card className="bg-white shadow-sm border-0">
                <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                        <Video className="h-5 w-5 text-blue-600" />
                        <span>Your Accepted Bookings</span>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {role !== 'student' ? (
                        <div className="text-sm text-gray-500">Switch to a student account to see joinable classes.</div>
                    ) : loading ? (
                        <div className="text-sm text-gray-500">Loading...</div>
                    ) : error ? (
                        <div className="text-sm text-red-600">{error}</div>
                    ) : acceptedBookings.length === 0 ? (
                        <div className="text-sm text-gray-500">No accepted bookings yet.</div>
                    ) : (
                        <div className="space-y-4">
                            {acceptedBookings.map((b: any) => (
                                <div key={b._id} className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-3">
                                            <Avatar className="h-10 w-10">
                                                <AvatarImage src="/placeholder.jpg" />
                                                <AvatarFallback>{b.gig?.teacher?.name?.split(' ').map((n: string) => n[0]).join('') || 'TC'}</AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <h3 className="font-semibold text-gray-900">{b.gig?.title}</h3>
                                                <p className="text-sm text-gray-600">with {b.gig?.teacher?.name}</p>
                                                <p className="text-xs text-gray-500">{new Date(b.scheduledDate).toLocaleDateString()} • {b.scheduledTime} • {b.gig?.duration} min</p>
                                            </div>
                                        </div>
                                        <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => router.push(`/class/${b._id}`)}>
                                            Join Now
                                        </Button>
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

// My Teachers View Component
function MyTeachersView() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">My Teachers</h1>
                <p className="text-gray-600 mt-2">Manage your favorite teachers and track your learning progress.</p>
            </div>

            <Card className="bg-white shadow-sm border-0">
                <CardContent className="p-6">
                    <div className="space-y-4">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <div key={i} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                                <div className="flex items-center space-x-4">
                                    <Avatar className="h-12 w-12">
                                        <AvatarImage src="/placeholder.jpg" />
                                        <AvatarFallback>TC</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <h3 className="font-semibold text-gray-900">Teacher {i + 1}</h3>
                                        <p className="text-sm text-gray-600">Mathematics • 15 classes completed</p>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-4">
                                    <div className="text-right">
                                        <p className="font-medium text-gray-900">$25/hr</p>
                                        <div className="flex items-center space-x-1">
                                            <Star className="h-4 w-4 text-yellow-400 fill-current" />
                                            <span className="text-sm text-gray-600">4.9</span>
                                        </div>
                                    </div>
                                    <Button variant="outline" size="sm">Book Again</Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

// Messages View Component
function MessagesView() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Messages</h1>
                <p className="text-gray-600 mt-2">Stay connected with your teachers and fellow students.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Conversations List */}
                <Card className="bg-white shadow-sm border-0 lg:col-span-1">
                    <CardHeader>
                        <CardTitle>Conversations</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {Array.from({ length: 5 }).map((_, i) => (
                                <div key={i} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer">
                                    <Avatar className="h-10 w-10">
                                        <AvatarImage src="/placeholder.jpg" />
                                        <AvatarFallback>TC</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-gray-900">Teacher {i + 1}</p>
                                        <p className="text-sm text-gray-500 truncate">Latest message preview...</p>
                                    </div>
                                    <Badge variant="secondary" className="text-xs">2</Badge>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Chat Area */}
                <Card className="bg-white shadow-sm border-0 lg:col-span-2">
                    <CardHeader>
                        <CardTitle>Chat with Teacher 1</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-96 bg-gray-50 rounded-lg p-4 flex flex-col">
                            <div className="flex-1 space-y-4 overflow-y-auto">
                                {Array.from({ length: 6 }).map((_, i) => (
                                    <div key={i} className={`flex ${i % 2 === 0 ? 'justify-start' : 'justify-end'}`}>
                                        <div className={`max-w-xs p-3 rounded-lg ${i % 2 === 0
                                            ? 'bg-white border border-gray-200'
                                            : 'bg-blue-600 text-white'
                                            }`}>
                                            <p className="text-sm">This is a sample message {i + 1} in the conversation.</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-4 flex space-x-2">
                                <input
                                    type="text"
                                    placeholder="Type your message..."
                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                                <Button className="bg-blue-600 hover:bg-blue-700">Send</Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

// Earnings View Component
function EarningsView() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Earnings</h1>
                <p className="text-gray-600 mt-2">Track your income and manage your payouts.</p>
            </div>

            {/* Earnings Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-white shadow-sm border-0">
                    <CardContent className="p-6">
                        <div className="text-center">
                            <p className="text-sm font-medium text-gray-600">This Month</p>
                            <p className="text-3xl font-bold text-gray-900">$2,400</p>
                            <div className="flex items-center justify-center space-x-1 mt-2">
                                <TrendingUp className="h-4 w-4 text-green-600" />
                                <span className="text-sm text-green-600">+12%</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-white shadow-sm border-0">
                    <CardContent className="p-6">
                        <div className="text-center">
                            <p className="text-sm font-medium text-gray-600">Total Earnings</p>
                            <p className="text-3xl font-bold text-gray-900">$18,500</p>
                            <p className="text-sm text-gray-500 mt-2">Since joining</p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-white shadow-sm border-0">
                    <CardContent className="p-6">
                        <div className="text-center">
                            <p className="text-sm font-medium text-gray-600">Hours Taught</p>
                            <p className="text-3xl font-bold text-gray-900">156</p>
                            <p className="text-sm text-gray-500 mt-2">This month</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Earnings Chart */}
            <Card className="bg-white shadow-sm border-0">
                <CardHeader>
                    <CardTitle>Earnings Over Time</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="h-64 flex items-end justify-between space-x-2">
                        {earningsData.map((data, i) => (
                            <div key={data.month} className="flex-1 flex flex-col items-center">
                                <div
                                    className="w-full bg-blue-600 rounded-t"
                                    style={{ height: `${(data.earnings / 2400) * 200}px` }}
                                />
                                <span className="text-xs text-gray-600 mt-2">{data.month}</span>
                                <span className="text-xs font-medium text-gray-900">${data.earnings}</span>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Recent Payouts */}
            <Card className="bg-white shadow-sm border-0">
                <CardHeader>
                    <CardTitle>Recent Payouts</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <div key={i} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                                <div>
                                    <p className="font-medium text-gray-900">Payout #{1000 + i}</p>
                                    <p className="text-sm text-gray-500">Processed on {new Date().toLocaleDateString()}</p>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-gray-900">${800 + (i * 100)}</p>
                                    <Badge variant="secondary" className="text-xs">Completed</Badge>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

// ===== TEACHER-SPECIFIC VIEWS =====

// Teacher Dashboard View Component
function TeacherDashboardView() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Welcome back, Professor!</h1>
                <p className="text-gray-600 mt-2">Here's your teaching dashboard overview.</p>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card className="bg-white shadow-sm border-0">
                    <CardContent className="p-6">
                        <div className="text-center">
                            <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                                <BookOpen className="h-6 w-6 text-blue-600" />
                            </div>
                            <p className="text-sm font-medium text-gray-600">Pending Bookings</p>
                            <p className="text-2xl font-bold text-gray-900">{pendingBookings.length}</p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-white shadow-sm border-0">
                    <CardContent className="p-6">
                        <div className="text-center">
                            <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                                <Video className="h-6 w-6 text-green-600" />
                            </div>
                            <p className="text-sm font-medium text-gray-600">Today's Classes</p>
                            <p className="text-2xl font-bold text-gray-900">3</p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-white shadow-sm border-0">
                    <CardContent className="p-6">
                        <div className="text-center">
                            <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                                <Users className="h-6 w-6 text-purple-600" />
                            </div>
                            <p className="text-sm font-medium text-gray-600">Active Students</p>
                            <p className="text-2xl font-bold text-gray-900">24</p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-white shadow-sm border-0">
                    <CardContent className="p-6">
                        <div className="text-center">
                            <div className="h-12 w-12 bg-orange-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                                <DollarSign className="h-6 w-6 text-orange-600" />
                            </div>
                            <p className="text-sm font-medium text-gray-600">This Month</p>
                            <p className="text-2xl font-bold text-gray-900">$2,400</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Pending Bookings */}
            <Card className="bg-white shadow-sm border-0">
                <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                        <BookOpen className="h-5 w-5 text-orange-600" />
                        <span>Pending Booking Requests</span>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {pendingBookings.map((booking) => (
                            <div key={booking.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                                <div className="flex items-center space-x-4">
                                    <Avatar className="h-12 w-12">
                                        <AvatarImage src={booking.avatar} />
                                        <AvatarFallback>{booking.student.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <h3 className="font-semibold text-gray-900">{booking.student}</h3>
                                        <p className="text-sm text-gray-600">{booking.subject}</p>
                                        <p className="text-xs text-gray-500">{booking.date} • {booking.duration}</p>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-3">
                                    <div className="text-right">
                                        <p className="font-medium text-gray-900">${booking.price}</p>
                                        <p className="text-sm text-gray-500">per hour</p>
                                    </div>
                                    <div className="flex space-x-2">
                                        <Button size="sm" className="bg-green-600 hover:bg-green-700">
                                            Accept
                                        </Button>
                                        <Button variant="outline" size="sm">
                                            Decline
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Upcoming Classes */}
            <Card className="bg-white shadow-sm border-0">
                <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                        <Calendar className="h-5 w-5 text-blue-600" />
                        <span>Upcoming Classes</span>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {upcomingTeacherClasses.map((classItem) => (
                            <div key={classItem.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                <div className="flex items-center space-x-4">
                                    <Avatar className="h-12 w-12">
                                        <AvatarImage src={classItem.avatar} />
                                        <AvatarFallback>{classItem.student.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <h3 className="font-semibold text-gray-900">{classItem.subject}</h3>
                                        <p className="text-sm text-gray-600">with {classItem.student}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="font-medium text-gray-900">{classItem.date}</p>
                                    <p className="text-sm text-gray-500">{classItem.duration}</p>
                                    <Badge variant="secondary" className="text-xs">{classItem.status}</Badge>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

// Bookings View Component
function BookingsView() {
    const [role, setRole] = useState<"student" | "teacher" | "admin" | null>(null)
    const [bookings, setBookings] = useState<any[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")
    const router = useRouter()
    const { toast } = useToast()

    useEffect(() => {
        if (typeof window !== "undefined") {
            setRole(localStorage.getItem("role") as any)
        }
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

    useEffect(() => {
        if (!role) return
        loadBookings()
    }, [role])

    const pending = bookings.filter((b) => b.status === "pending")
    const accepted = bookings.filter((b) => b.status === "accepted")
    const rejected = bookings.filter((b) => b.status === "rejected")

    const updateStatus = async (id: string, status: "accepted" | "rejected") => {
        try {
            await bookingsApi.updateBookingStatus(id, status)
            setBookings((prev) => prev.map((b) => (b._id === id ? { ...b, status } : b)))
            const b = bookings.find((x) => x._id === id)
            toast({
                title: status === "accepted" ? "Booking accepted" : "Booking rejected",
                description:
                    status === "accepted"
                        ? `You accepted ${b?.student?.name || "the student"}'s request for "${b?.gig?.title || "class"}".`
                        : `You rejected ${b?.student?.name || "the student"}'s request for "${b?.gig?.title || "class"}".`,
            })
        } catch (e: any) {
            setError(e?.response?.data?.message || `Failed to mark as ${status}`)
        }
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Booking Requests</h1>
                <p className="text-gray-600 mt-2">Manage incoming booking requests from students.</p>
            </div>

            {error && <div className="text-red-600 text-sm">{error}</div>}

            {/* Booking Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-white shadow-sm border-0">
                    <CardContent className="p-6">
                        <div className="text-center">
                            <p className="text-sm font-medium text-gray-600">Pending</p>
                            <p className="text-3xl font-bold text-orange-600">{pending.length}</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-white shadow-sm border-0">
                    <CardContent className="p-6">
                        <div className="text-center">
                            <p className="text-sm font-medium text-gray-600">Accepted</p>
                            <p className="text-3xl font-bold text-green-600">{accepted.length}</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-white shadow-sm border-0">
                    <CardContent className="p-6">
                        <div className="text-center">
                            <p className="text-sm font-medium text-gray-600">Declined</p>
                            <p className="text-3xl font-bold text-red-600">{rejected.length}</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Pending Requests */}
            <Card className="bg-white shadow-sm border-0">
                <CardHeader>
                    <CardTitle>Pending Requests</CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="text-sm text-gray-500">Loading...</div>
                    ) : (
                        <div className="space-y-4">
                            {pending.length === 0 ? (
                                <div className="text-sm text-gray-500">No pending requests.</div>
                            ) : (
                                pending.map((b) => (
                                    <div key={b._id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                                        <div className="flex items-center space-x-4">
                                            <Avatar className="h-12 w-12">
                                                <AvatarImage src="/placeholder.jpg" />
                                                <AvatarFallback>{b.student?.name?.split(' ').map((n: string) => n[0]).join('') || 'ST'}</AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <h3 className="font-semibold text-gray-900">{b.student?.name || 'Student'}</h3>
                                                <p className="text-sm text-gray-600">{b.gig?.title}</p>
                                                <p className="text-xs text-gray-500">{new Date(b.scheduledDate).toLocaleDateString()} • {b.scheduledTime}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-3">
                                            <div className="text-right">
                                                <p className="font-medium text-gray-900">${b.gig?.price}</p>
                                                <p className="text-sm text-gray-500">per hour</p>
                                            </div>
                                            <div className="flex space-x-2">
                                                <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => updateStatus(b._id, 'accepted')}>Accept</Button>
                                                <Button variant="outline" size="sm" onClick={() => updateStatus(b._id, 'rejected')}>Decline</Button>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}

// My Classes View Component
function MyClassesView() {
    const [role, setRole] = useState<"student" | "teacher" | "admin" | null>(null)
    const [acceptedBookings, setAcceptedBookings] = useState<any[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")
    const router = useRouter()

    useEffect(() => {
        if (typeof window !== "undefined") {
            setRole(localStorage.getItem("role") as any)
        }
    }, [])

    useEffect(() => {
        const load = async () => {
            if (role !== "teacher") return
            try {
                setLoading(true)
                const res = await bookingsApi.getMyBookings()
                setAcceptedBookings((res?.data || []).filter((b: any) => b.status === 'accepted'))
            } catch (e: any) {
                setError(e?.response?.data?.message || 'Failed to load classes')
            } finally {
                setLoading(false)
            }
        }
        load()
    }, [role])

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">My Classes</h1>
                <p className="text-gray-600 mt-2">Manage your scheduled classes and sessions.</p>
            </div>

            {/* Class Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-white shadow-sm border-0">
                    <CardContent className="p-6">
                        <div className="text-center">
                            <p className="text-sm font-medium text-gray-600">Today</p>
                            <p className="text-3xl font-bold text-blue-600">3</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-white shadow-sm border-0">
                    <CardContent className="p-6">
                        <div className="text-center">
                            <p className="text-sm font-medium text-gray-600">This Week</p>
                            <p className="text-3xl font-bold text-green-600">18</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-white shadow-sm border-0">
                    <CardContent className="p-6">
                        <div className="text-center">
                            <p className="text-sm font-medium text-gray-600">Total Hours</p>
                            <p className="text-3xl font-bold text-purple-600">156</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Your Accepted Bookings (Live Classes) */}
            <Card className="bg-white shadow-sm border-0">
                <CardHeader>
                    <CardTitle>Your Accepted Bookings</CardTitle>
                </CardHeader>
                <CardContent>
                    {role !== 'teacher' ? (
                        <div className="text-sm text-gray-500">Switch to a teacher account to see your classes.</div>
                    ) : loading ? (
                        <div className="text-sm text-gray-500">Loading...</div>
                    ) : error ? (
                        <div className="text-sm text-red-600">{error}</div>
                    ) : acceptedBookings.length === 0 ? (
                        <div className="text-sm text-gray-500">No accepted bookings yet.</div>
                    ) : (
                        <div className="space-y-4">
                            {acceptedBookings.map((b: any) => (
                                <div key={b._id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                                    <div className="flex items-center space-x-4">
                                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                            <Video className="h-6 w-6 text-blue-600" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-gray-900">{b.gig?.title}</h3>
                                            <p className="text-sm text-gray-600">with {b.student?.name || 'Student'}</p>
                                            <p className="text-xs text-gray-500">{new Date(b.scheduledDate).toLocaleDateString()} • {b.scheduledTime} • {b.gig?.duration} min</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-3">
                                        <Badge variant="secondary">Accepted</Badge>
                                        <Button size="sm" className="bg-blue-600 hover:bg-blue-700" onClick={() => router.push(`/class/${b._id}`)}>
                                            Start Class
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Today's Classes (Demo) */}
            <Card className="bg-white shadow-sm border-0">
                <CardHeader>
                    <CardTitle>Today's Schedule</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                                <div className="flex items-center space-x-4">
                                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                        <Video className="h-6 w-6 text-blue-600" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-900">Class {i + 1}</h3>
                                        <p className="text-sm text-gray-600">Mathematics • Student {i + 1}</p>
                                        <p className="text-xs text-gray-500">2:00 PM - 3:00 PM</p>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-3">
                                    <Badge variant="secondary">Confirmed</Badge>
                                    <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                                        Start Class
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Upcoming Classes */}
            <Card className="bg-white shadow-sm border-0">
                <CardHeader>
                    <CardTitle>Upcoming Classes</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <div key={i} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                                <div className="flex items-center space-x-4">
                                    <Avatar className="h-12 w-12">
                                        <AvatarImage src="/placeholder.jpg" />
                                        <AvatarFallback>ST</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <h3 className="font-semibold text-gray-900">Student {i + 1}</h3>
                                        <p className="text-sm text-gray-600">Physics • Advanced Level</p>
                                        <p className="text-xs text-gray-500">Tomorrow, 10:00 AM • 90 min</p>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-3">
                                    <Badge variant="secondary">Confirmed</Badge>
                                    <Button variant="outline" size="sm">
                                        Reschedule
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

// Students View Component
function StudentsView() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">My Students</h1>
                <p className="text-gray-600 mt-2">Track your students' progress and manage relationships.</p>
            </div>

            {/* Student Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-white shadow-sm border-0">
                    <CardContent className="p-6">
                        <div className="text-center">
                            <p className="text-sm font-medium text-gray-600">Active Students</p>
                            <p className="text-3xl font-bold text-blue-600">24</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-white shadow-sm border-0">
                    <CardContent className="p-6">
                        <div className="text-center">
                            <p className="text-sm font-medium text-gray-600">Total Classes</p>
                            <p className="text-3xl font-bold text-green-600">156</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-white shadow-sm border-0">
                    <CardContent className="p-6">
                        <div className="text-center">
                            <p className="text-sm font-medium text-gray-600">Avg Rating</p>
                            <p className="text-3xl font-bold text-yellow-600">4.9</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Students List */}
            <Card className="bg-white shadow-sm border-0">
                <CardHeader>
                    <CardTitle>Student Directory</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {myStudents.map((student) => (
                            <div key={student.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                                <div className="flex items-center space-x-4">
                                    <Avatar className="h-12 w-12">
                                        <AvatarImage src={student.avatar} />
                                        <AvatarFallback>{student.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <h3 className="font-semibold text-gray-900">{student.name}</h3>
                                        <p className="text-sm text-gray-600">{student.subject}</p>
                                        <p className="text-xs text-gray-500">{student.classesCompleted} classes completed</p>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-4">
                                    <div className="text-right">
                                        <div className="flex items-center space-x-1">
                                            <Star className="h-4 w-4 text-yellow-400 fill-current" />
                                            <span className="text-sm text-gray-600">{student.rating}</span>
                                        </div>
                                        <p className="text-xs text-gray-500">Last: {student.lastClass}</p>
                                    </div>
                                    <div className="flex space-x-2">
                                        <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                                            Schedule Class
                                        </Button>
                                        <Button variant="outline" size="sm">
                                            View Progress
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

// Gigs View Component
function GigsView() {
    const [myGigs, setMyGigs] = useState<any[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")
    const { toast } = useToast()
    const router = useRouter()

    useEffect(() => {
        const load = async () => {
            try {
                setLoading(true)
                setError("")
                const res = await gigsApi.getAllGigs()
                const userStr = typeof window !== 'undefined' ? localStorage.getItem('user') : null
                const me = userStr ? JSON.parse(userStr) : null
                const list = (res?.data || []).filter((g: any) => (me ? g.teacher?._id === me.id : true))
                setMyGigs(list)
            } catch (e: any) {
                setError(e?.response?.data?.message || 'Failed to load gigs')
            } finally {
                setLoading(false)
            }
        }
        load()
    }, [])

    const handleThumbUpload = async (gigId: string, file: File) => {
        try {
            const up = await uploadsApi.uploadImage(file, 'educonnect/gig-thumbnails')
            const url = up?.data?.url
            if (!url) throw new Error('No URL returned')
            const res = await gigsApi.updateGig(gigId, { thumbnailUrl: url })
            const updated = res?.data
            setMyGigs(prev => prev.map((g: any) => g._id === gigId ? { ...g, thumbnailUrl: updated?.thumbnailUrl || url } : g))
            toast({ title: 'Thumbnail updated', description: 'Your gig thumbnail has been updated.' })
        } catch (e: any) {
            toast({ title: 'Upload failed', description: e?.response?.data?.message || 'Could not upload thumbnail.', variant: 'destructive' })
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">My Gigs</h1>
                    <p className="text-gray-600 mt-2">Manage your teaching services and offerings.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Link href="/teacher/gigs">
                        <Button variant="outline">Manage My Gigs</Button>
                    </Link>
                    <Link href="/teacher/gigs/new">
                        <Button className="bg-blue-600 hover:bg-blue-700">
                            <Star className="h-4 w-4 mr-2" />
                            Create New Gig
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Gigs List */}
            <Card className="bg-white shadow-sm border-0">
                <CardHeader>
                    <CardTitle>Your Services</CardTitle>
                </CardHeader>
                <CardContent>
                    {error && (<div className="text-red-600 text-sm mb-4">{error}</div>)}
                    <div className="space-y-4">
                        {loading ? (
                            <div className="text-sm text-gray-500">Loading...</div>
                        ) : myGigs.length === 0 ? (
                            <div className="text-sm text-gray-500">No gigs yet.</div>
                        ) : myGigs.map((gig: any) => (
                            <div key={gig._id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                                <div className="flex items-center space-x-4">
                                    <Avatar className="h-12 w-12">
                                        <AvatarImage src={gig.thumbnailUrl || '/placeholder.jpg'} />
                                        <AvatarFallback>{(gig.teacher?.name || 'TC').split(' ').map((n: string) => n[0]).join('')}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <h3 className="font-semibold text-gray-900">{gig.title}</h3>
                                        <p className="text-sm text-gray-600">{gig.category} • {gig.duration} min</p>
                                        <div className="flex items-center space-x-2 mt-2">
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={(e) => {
                                                    const f = e.target.files?.[0]
                                                    if (f) handleThumbUpload(gig._id, f)
                                                }}
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <div className="text-right mr-2">
                                        <p className="font-medium text-gray-900">${gig.price}</p>
                                        <p className="text-sm text-gray-500">per hour</p>
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                            const id = gig.teacher?._id
                                            if (id) router.push(`/teachers/${id}`)
                                        }}
                                    >
                                        View Profile
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

// Profile View for Teacher dashboard
function ProfileView() {
    const [profile, setProfile] = useState<UserProfile>(() => {
        const userStr = typeof window !== 'undefined' ? localStorage.getItem('user') : null
        const me = userStr ? JSON.parse(userStr) : null
        return {
            id: me?.id || 'me',
            name: me?.name || 'Your Name',
            email: me?.email || 'you@example.com',
            phone: '',
            location: '',
            bio: 'Tell students about your experience and teaching style.',
            headline: 'Teacher at EduConnect',
            userType: 'teacher',
            avatar: '',
            coverImage: '',
            experiences: [],
            education: [],
            work: [],
            skills: [],
            languages: [],
            subjects: [],
            hourlyRate: undefined,
            availability: '',
            timezone: '',
            demoVideos: []
        }
    })

    const handleProfileUpdate = (updates: Partial<UserProfile>) => setProfile(prev => ({ ...prev, ...updates }))
    const handleExperienceUpdate = (experiences: Experience[]) => setProfile(prev => ({ ...prev, experiences }))
    const handleEducationUpdate = (education: Education[]) => setProfile(prev => ({ ...prev, education }))
    const handleWorkUpdate = (work: Work[]) => setProfile(prev => ({ ...prev, work }))
    const handleDemoVideoUpdate = (demoVideos: DemoVideo[]) => setProfile(prev => ({ ...prev, demoVideos }))

    return (
        <div className="container mx-auto px-0 md:px-4 py-4 md:py-6">
            <div className="max-w-4xl mx-auto space-y-6">
                <ProfileHeader profile={profile} onUpdate={handleProfileUpdate} isEditable={true} />
                <div className="space-y-6">
                    <ExperienceSection experiences={profile.experiences} onUpdate={handleExperienceUpdate} isEditable={true} />
                    <WorkSection work={profile.work} onUpdate={handleWorkUpdate} isEditable={true} />
                    <EducationSection education={profile.education} onUpdate={handleEducationUpdate} isEditable={true} />
                    <DemoVideoSection videos={profile.demoVideos || []} onUpdate={handleDemoVideoUpdate} isEditable={true} />
                </div>
            </div>
        </div>
    )
}

// Teacher Earnings View Component
function TeacherEarningsView() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Earnings Dashboard</h1>
                <p className="text-gray-600 mt-2">Track your income and manage your payouts.</p>
            </div>

            {/* Earnings Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card className="bg-white shadow-sm border-0">
                    <CardContent className="p-6">
                        <div className="text-center">
                            <p className="text-sm font-medium text-gray-600">This Month</p>
                            <p className="text-3xl font-bold text-blue-600">$2,400</p>
                            <div className="flex items-center justify-center space-x-1 mt-2">
                                <TrendingUp className="h-4 w-4 text-green-600" />
                                <span className="text-sm text-green-600">+12%</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-white shadow-sm border-0">
                    <CardContent className="p-6">
                        <div className="text-center">
                            <p className="text-sm font-medium text-gray-600">Total Earnings</p>
                            <p className="text-3xl font-bold text-green-600">$18,500</p>
                            <p className="text-sm text-gray-500 mt-2">Since joining</p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-white shadow-sm border-0">
                    <CardContent className="p-6">
                        <div className="text-center">
                            <p className="text-sm font-medium text-gray-600">Hours Taught</p>
                            <p className="text-3xl font-bold text-purple-600">156</p>
                            <p className="text-sm text-gray-500 mt-2">This month</p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-white shadow-sm border-0">
                    <CardContent className="p-6">
                        <div className="text-center">
                            <p className="text-sm font-medium text-gray-600">Pending</p>
                            <p className="text-3xl font-bold text-orange-600">$450</p>
                            <p className="text-sm text-gray-500 mt-2">Next payout</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Earnings Chart */}
            <Card className="bg-white shadow-sm border-0">
                <CardHeader>
                    <CardTitle>Earnings Over Time</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="h-64 flex items-end justify-between space-x-2">
                        {earningsData.map((data, i) => (
                            <div key={data.month} className="flex-1 flex flex-col items-center">
                                <div
                                    className="w-full bg-blue-600 rounded-t"
                                    style={{ height: `${(data.earnings / 2400) * 200}px` }}
                                />
                                <span className="text-xs text-gray-600 mt-2">{data.month}</span>
                                <span className="text-xs font-medium text-gray-900">${data.earnings}</span>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Recent Transactions */}
            <Card className="bg-white shadow-sm border-0">
                <CardHeader>
                    <CardTitle>Recent Transactions</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <div key={i} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                                <div className="flex items-center space-x-4">
                                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                                        <DollarSign className="h-5 w-5 text-green-600" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-900">Class with Student {i + 1}</p>
                                        <p className="text-sm text-gray-500">Mathematics • 60 min</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-gray-900">${25 + (i * 5)}</p>
                                    <p className="text-sm text-gray-500">{new Date().toLocaleDateString()}</p>
                                    <Badge variant="secondary" className="text-xs">Completed</Badge>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

// Settings View Component
function SettingsView() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
                <p className="text-gray-600 mt-2">Manage your account preferences and profile information.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Profile Settings */}
                <Card className="bg-white shadow-sm border-0">
                    <CardHeader>
                        <CardTitle>Profile Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                            <input
                                type="text"
                                defaultValue="John Doe"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                            <input
                                type="email"
                                defaultValue="john.doe@example.com"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                            <input
                                type="tel"
                                defaultValue="+1 (555) 123-4567"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                        <Button className="w-full bg-blue-600 hover:bg-blue-700">Save Changes</Button>
                    </CardContent>
                </Card>

                {/* Account Settings */}
                <Card className="bg-white shadow-sm border-0">
                    <CardHeader>
                        <CardTitle>Account Settings</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Current Password</label>
                            <input
                                type="password"
                                placeholder="Enter current password"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
                            <input
                                type="password"
                                placeholder="Enter new password"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Confirm New Password</label>
                            <input
                                type="password"
                                placeholder="Confirm new password"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                        <Button variant="outline" className="w-full">Change Password</Button>
                    </CardContent>
                </Card>
            </div>

            {/* Notification Settings */}
            <Card className="bg-white shadow-sm border-0">
                <CardHeader>
                    <CardTitle>Notification Preferences</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-medium text-gray-900">Email Notifications</p>
                                <p className="text-sm text-gray-500">Receive updates about your classes and messages</p>
                            </div>
                            <Button variant="outline" size="sm">Configure</Button>
                        </div>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-medium text-gray-900">Push Notifications</p>
                                <p className="text-sm text-gray-500">Get instant alerts on your device</p>
                            </div>
                            <Button variant="outline" size="sm">Configure</Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

// ===== ADMIN-SPECIFIC MOCK DATA =====

const adminStats = {
    totalUsers: 1247,
    totalTeachers: 89,
    totalStudents: 1158,
    totalRevenue: 45600,
    todayClasses: 23,
    monthClasses: 456,
    pendingApprovals: 12,
    bannedUsers: 3
}

const allUsers = [
    {
        id: 1,
        name: "Sarah Johnson",
        email: "sarah.j@example.com",
        type: "teacher",
        status: "active",
        joinDate: "2024-01-15",
        lastActive: "2 hours ago",
        avatar: "/placeholder.jpg",
        rating: 4.9,
        classesCompleted: 156
    },
    {
        id: 2,
        name: "Emma Wilson",
        email: "emma.w@example.com",
        type: "student",
        status: "active",
        joinDate: "2024-02-20",
        lastActive: "1 day ago",
        avatar: "/placeholder.jpg",
        rating: 4.8,
        classesCompleted: 45
    },
    {
        id: 3,
        name: "David Chen",
        email: "david.c@example.com",
        type: "teacher",
        status: "banned",
        joinDate: "2023-11-10",
        lastActive: "1 week ago",
        avatar: "/placeholder.jpg",
        rating: 4.2,
        classesCompleted: 89
    },
    {
        id: 4,
        name: "Michael Brown",
        email: "michael.b@example.com",
        type: "student",
        status: "active",
        joinDate: "2024-03-05",
        lastActive: "3 hours ago",
        avatar: "/placeholder.jpg",
        rating: 4.7,
        classesCompleted: 23
    }
]

const transactions = [
    {
        id: 1,
        student: "Emma Wilson",
        teacher: "Sarah Johnson",
        amount: 25,
        date: "2024-06-15",
        status: "completed",
        classSubject: "Calculus",
        duration: "60 min"
    },
    {
        id: 2,
        student: "Michael Brown",
        teacher: "Alex Kim",
        amount: 30,
        date: "2024-06-15",
        status: "pending",
        classSubject: "Physics",
        duration: "90 min"
    },
    {
        id: 3,
        student: "Lisa Garcia",
        teacher: "David Chen",
        amount: 20,
        date: "2024-06-14",
        status: "completed",
        classSubject: "Spanish",
        duration: "45 min"
    }
]

const classAnalytics = {
    today: {
        total: 23,
        completed: 18,
        cancelled: 2,
        ongoing: 3
    },
    thisMonth: {
        total: 456,
        completed: 412,
        cancelled: 28,
        ongoing: 16
    },
    subjects: [
        { name: "Mathematics", count: 156, percentage: 34 },
        { name: "Physics", count: 89, percentage: 20 },
        { name: "Chemistry", count: 67, percentage: 15 },
        { name: "English", count: 45, percentage: 10 },
        { name: "Spanish", count: 34, percentage: 7 },
        { name: "Other", count: 65, percentage: 14 }
    ]
}

// ===== ADMIN VIEW COMPONENTS =====

// Admin Dashboard View Component
function AdminDashboardView() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
                <p className="text-gray-600 mt-2">Monitor and manage the entire EduConnect platform.</p>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card className="bg-white shadow-sm border-0">
                    <CardContent className="p-6">
                        <div className="text-center">
                            <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                                <Users className="h-6 w-6 text-blue-600" />
                            </div>
                            <p className="text-sm font-medium text-gray-600">Total Users</p>
                            <p className="text-2xl font-bold text-gray-900">{adminStats.totalUsers.toLocaleString()}</p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-white shadow-sm border-0">
                    <CardContent className="p-6">
                        <div className="text-center">
                            <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                                <Video className="h-6 w-6 text-green-600" />
                            </div>
                            <p className="text-sm font-medium text-gray-600">Today's Classes</p>
                            <p className="text-2xl font-bold text-gray-900">{adminStats.todayClasses}</p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-white shadow-sm border-0">
                    <CardContent className="p-6">
                        <div className="text-center">
                            <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                                <DollarSign className="h-6 w-6 text-purple-600" />
                            </div>
                            <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                            <p className="text-2xl font-bold text-gray-900">${adminStats.totalRevenue.toLocaleString()}</p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-white shadow-sm border-0">
                    <CardContent className="p-6">
                        <div className="text-center">
                            <div className="h-12 w-12 bg-orange-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                                <BookOpen className="h-6 w-6 text-orange-600" />
                            </div>
                            <p className="text-sm font-medium text-gray-600">Pending Approvals</p>
                            <p className="text-2xl font-bold text-gray-900">{adminStats.pendingApprovals}</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="bg-white shadow-sm border-0">
                    <CardHeader>
                        <CardTitle>Recent Transactions</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {transactions.slice(0, 3).map((transaction) => (
                                <div key={transaction.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                    <div className="flex items-center space-x-3">
                                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                                            <DollarSign className="h-4 w-4 text-green-600" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-900">${transaction.amount}</p>
                                            <p className="text-xs text-gray-500">{transaction.student} → {transaction.teacher}</p>
                                        </div>
                                    </div>
                                    <Badge variant={transaction.status === "completed" ? "secondary" : "outline"}>
                                        {transaction.status}
                                    </Badge>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-white shadow-sm border-0">
                    <CardHeader>
                        <CardTitle>Platform Health</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">Active Teachers</span>
                                <span className="font-medium text-gray-900">{adminStats.totalTeachers}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">Active Students</span>
                                <span className="font-medium text-gray-900">{adminStats.totalStudents}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">Banned Users</span>
                                <span className="font-medium text-red-600">{adminStats.bannedUsers}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">Monthly Classes</span>
                                <span className="font-medium text-gray-900">{adminStats.monthClasses}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

// User Management View Component
function UserManagementView() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
                <p className="text-gray-600 mt-2">Manage all users, approve teachers, and handle bans.</p>
            </div>

            {/* Search and Filters */}
            <Card className="bg-white shadow-sm border-0">
                <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search users by name or email..."
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                        </div>
                        <Button variant="outline" className="flex items-center space-x-2">
                            <Filter className="h-4 w-4" />
                            <span>Filters</span>
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Users List */}
            <Card className="bg-white shadow-sm border-0">
                <CardHeader>
                    <CardTitle>All Users</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {allUsers.map((user) => (
                            <div key={user.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                                <div className="flex items-center space-x-4">
                                    <Avatar className="h-12 w-12">
                                        <AvatarImage src={user.avatar} />
                                        <AvatarFallback>{user.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <h3 className="font-semibold text-gray-900">{user.name}</h3>
                                        <p className="text-sm text-gray-600">{user.email}</p>
                                        <div className="flex items-center space-x-2 mt-1">
                                            <Badge variant={user.type === "teacher" ? "default" : "secondary"}>
                                                {user.type}
                                            </Badge>
                                            <Badge variant={user.status === "active" ? "secondary" : "destructive"}>
                                                {user.status}
                                            </Badge>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-4">
                                    <div className="text-right">
                                        <p className="text-sm text-gray-500">Joined {user.joinDate}</p>
                                        <p className="text-xs text-gray-400">Last active: {user.lastActive}</p>
                                    </div>
                                    <div className="flex space-x-2">
                                        {user.status === "banned" ? (
                                            <Button size="sm" className="bg-green-600 hover:bg-green-700">
                                                Unban
                                            </Button>
                                        ) : (
                                            <Button size="sm" variant="destructive">
                                                Ban User
                                            </Button>
                                        )}
                                        <Button size="sm" variant="outline">
                                            View Details
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

// Transactions View Component
function TransactionsView() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Transaction History</h1>
                <p className="text-gray-600 mt-2">Monitor all financial transactions and platform revenue.</p>
            </div>

            {/* Transaction Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-white shadow-sm border-0">
                    <CardContent className="p-6">
                        <div className="text-center">
                            <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                            <p className="text-3xl font-bold text-green-600">${adminStats.totalRevenue.toLocaleString()}</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-white shadow-sm border-0">
                    <CardContent className="p-6">
                        <div className="text-center">
                            <p className="text-sm font-medium text-gray-600">Today's Revenue</p>
                            <p className="text-3xl font-bold text-blue-600">$1,250</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-white shadow-sm border-0">
                    <CardContent className="p-6">
                        <div className="text-center">
                            <p className="text-sm font-medium text-gray-600">Pending Payouts</p>
                            <p className="text-3xl font-bold text-orange-600">$8,450</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Transactions List */}
            <Card className="bg-white shadow-sm border-0">
                <CardHeader>
                    <CardTitle>Recent Transactions</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {transactions.map((transaction) => (
                            <div key={transaction.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                                <div className="flex items-center space-x-4">
                                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                                        <DollarSign className="h-6 w-6 text-green-600" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-900">{transaction.classSubject}</h3>
                                        <p className="text-sm text-gray-600">{transaction.student} → {transaction.teacher}</p>
                                        <p className="text-xs text-gray-500">{transaction.duration} • {transaction.date}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-xl font-bold text-gray-900">${transaction.amount}</p>
                                    <Badge variant={transaction.status === "completed" ? "secondary" : "outline"}>
                                        {transaction.status}
                                    </Badge>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

// Class Analytics View Component
function ClassAnalyticsView() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Class Analytics</h1>
                <p className="text-gray-600 mt-2">Track class performance and platform usage statistics.</p>
            </div>

            {/* Class Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card className="bg-white shadow-sm border-0">
                    <CardContent className="p-6">
                        <div className="text-center">
                            <p className="text-sm font-medium text-gray-600">Today's Classes</p>
                            <p className="text-3xl font-bold text-blue-600">{classAnalytics.today.total}</p>
                            <p className="text-xs text-gray-500">{classAnalytics.today.completed} completed</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-white shadow-sm border-0">
                    <CardContent className="p-6">
                        <div className="text-center">
                            <p className="text-sm font-medium text-gray-600">This Month</p>
                            <p className="text-3xl font-bold text-green-600">{classAnalytics.thisMonth.total}</p>
                            <p className="text-xs text-gray-500">{classAnalytics.thisMonth.completed} completed</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-white shadow-sm border-0">
                    <CardContent className="p-6">
                        <div className="text-center">
                            <p className="text-sm font-medium text-gray-600">Cancellation Rate</p>
                            <p className="text-3xl font-bold text-orange-600">6.1%</p>
                            <p className="text-xs text-gray-500">This month</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-white shadow-sm border-0">
                    <CardContent className="p-6">
                        <div className="text-center">
                            <p className="text-sm font-medium text-gray-600">Avg Class Duration</p>
                            <p className="text-3xl font-bold text-purple-600">67 min</p>
                            <p className="text-xs text-gray-500">This month</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Subject Distribution */}
            <Card className="bg-white shadow-sm border-0">
                <CardHeader>
                    <CardTitle>Class Distribution by Subject</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {classAnalytics.subjects.map((subject) => (
                            <div key={subject.name} className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                    <div className="w-4 h-4 bg-blue-600 rounded"></div>
                                    <span className="font-medium text-gray-900">{subject.name}</span>
                                </div>
                                <div className="flex items-center space-x-4">
                                    <div className="w-32 bg-gray-200 rounded-full h-2">
                                        <div
                                            className="bg-blue-600 h-2 rounded-full"
                                            style={{ width: `${subject.percentage}%` }}
                                        ></div>
                                    </div>
                                    <span className="text-sm text-gray-600 w-16 text-right">
                                        {subject.count} ({subject.percentage}%)
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

// Reports View Component
function ReportsView() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
                <p className="text-gray-600 mt-2">Generate comprehensive reports on platform performance.</p>
            </div>

            {/* Report Types */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card className="bg-white shadow-sm border-0 hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="p-6 text-center">
                        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Users className="h-8 w-8 text-blue-600" />
                        </div>
                        <h3 className="font-semibold text-gray-900 mb-2">User Growth Report</h3>
                        <p className="text-sm text-gray-600 mb-4">Track user registration and growth trends</p>
                        <Button className="w-full bg-blue-600 hover:bg-blue-700">Generate Report</Button>
                    </CardContent>
                </Card>

                <Card className="bg-white shadow-sm border-0 hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="p-6 text-center">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Video className="h-8 w-8 text-green-600" />
                        </div>
                        <h3 className="font-semibold text-gray-900 mb-2">Class Performance</h3>
                        <p className="text-sm text-gray-600 mb-4">Analyze class completion and success rates</p>
                        <Button className="w-full bg-green-600 hover:bg-green-700">Generate Report</Button>
                    </CardContent>
                </Card>

                <Card className="bg-white shadow-sm border-0 hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="p-6 text-center">
                        <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <DollarSign className="h-8 w-8 text-purple-600" />
                        </div>
                        <h3 className="font-semibold text-gray-900 mb-2">Revenue Analysis</h3>
                        <p className="text-sm text-gray-600 mb-4">Financial performance and trends</p>
                        <Button className="w-full bg-purple-600 hover:bg-purple-700">Generate Report</Button>
                    </CardContent>
                </Card>

                <Card className="bg-white shadow-sm border-0 hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="p-6 text-center">
                        <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Star className="h-8 w-8 text-orange-600" />
                        </div>
                        <h3 className="font-semibold text-gray-900 mb-2">Teacher Performance</h3>
                        <p className="text-sm text-gray-600 mb-4">Teacher ratings and student feedback</p>
                        <Button className="w-full bg-orange-600 hover:bg-orange-700">Generate Report</Button>
                    </CardContent>
                </Card>

                <Card className="bg-white shadow-sm border-0 hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="p-6 text-center">
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <TrendingUp className="h-8 w-8 text-red-600" />
                        </div>
                        <h3 className="font-semibold text-gray-900 mb-2">Platform Health</h3>
                        <p className="text-sm text-gray-600 mb-4">System performance and user satisfaction</p>
                        <Button className="w-full bg-red-600 hover:bg-red-700">Generate Report</Button>
                    </CardContent>
                </Card>

                <Card className="bg-white shadow-sm border-0 hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="p-6 text-center">
                        <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Calendar className="h-8 w-8 text-indigo-600" />
                        </div>
                        <h3 className="font-semibold text-gray-900 mb-2">Monthly Summary</h3>
                        <p className="text-sm text-gray-600 mb-4">Comprehensive monthly overview</p>
                        <Button className="w-full bg-indigo-600 hover:bg-indigo-700">Generate Report</Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
