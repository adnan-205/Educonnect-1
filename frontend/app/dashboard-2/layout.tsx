"use client"

import { useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useUser } from "@clerk/nextjs"
import Link from "next/link"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
    Home,
    BookOpen,
    Users,
    MessageCircle,
    DollarSign,
    Settings,
    Video,
    User,
    Star
} from "lucide-react"

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const [userType, setUserType] = useState<"student" | "teacher" | "admin" | null>(null)
    const router = useRouter()
    const pathname = usePathname()
    const { isLoaded, isSignedIn, user } = useUser()
    const [displayName, setDisplayName] = useState<string>("")
    const [avatarUrl, setAvatarUrl] = useState<string>("")

    // Auth + role guard: must be signed in and have a role set
    useEffect(() => {
        if (!isLoaded) return
        // Allow embedded video call route without sign-in to avoid loops
        const isVideoCallRoute = typeof window !== "undefined" && window.location.pathname.startsWith("/dashboard-2/video-call/")
        if (!isSignedIn && !isVideoCallRoute) {
            router.replace("/sign-in")
            return
        }
        // Allow joining embedded video call even if role not yet set
        const role = typeof window !== "undefined" ? localStorage.getItem("role") : null
        if (!role && !isVideoCallRoute) {
            router.replace("/role-selection")
            return
        }
    }, [isLoaded, isSignedIn, router])

    // Get user type from localStorage
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

    // Load displayName and avatar from backend user (localStorage) with Clerk fallback
    useEffect(() => {
        try {
            const raw = typeof window !== 'undefined' ? localStorage.getItem('user') : null
            if (raw) {
                const u = JSON.parse(raw)
                if (u?.name) setDisplayName(u.name)
                if (u?.avatar) setAvatarUrl(u.avatar)
            }
        } catch {}
        if (isLoaded && isSignedIn) {
            if (!displayName) setDisplayName(user?.fullName || user?.username || user?.firstName || 'User')
            if (!avatarUrl) setAvatarUrl((user?.imageUrl as string) || '')
        }
        const onStorage = (e: StorageEvent) => {
            if (e.key === 'user' && e.newValue) {
                try {
                    const u = JSON.parse(e.newValue)
                    if (u?.name) setDisplayName(u.name)
                    if (u?.avatar) setAvatarUrl(u.avatar)
                } catch {}
            }
        }
        if (typeof window !== 'undefined') {
            window.addEventListener('storage', onStorage)
            return () => window.removeEventListener('storage', onStorage)
        }
    }, [isLoaded, isSignedIn, user])

    const initials = (name: string) => name ? name.split(' ').map(n => n[0]).join('').toUpperCase() : 'U'

    const navigationItems = userType === "teacher" ? [
        { id: "home", label: "Dashboard", icon: Home, href: "/dashboard-2" },
        { id: "profile", label: "Profile", icon: User, href: "/dashboard-2/profile" },
        { id: "bookings", label: "Bookings", icon: BookOpen, href: "/dashboard-2/bookings" },
        { id: "my-classes", label: "My Classes", icon: Video, href: "/dashboard-2/my-classes" },
        { id: "students", label: "My Students", icon: Users, href: "/dashboard-2/students" },
        { id: "gigs", label: "My Gigs", icon: Star, href: "/dashboard-2/gigs" },
        { id: "earnings", label: "Earnings", icon: DollarSign, href: "/dashboard-2/earnings" },
        { id: "messages", label: "Messages", icon: MessageCircle, href: "/dashboard-2/messages" },
        { id: "settings", label: "Settings", icon: Settings, href: "/dashboard-2/settings" }
    ] : userType === "admin" ? [
        { id: "home", label: "Admin Dashboard", icon: Home, href: "/dashboard-2" },
        { id: "users", label: "User Management", icon: Users, href: "/dashboard-2/users" },
        { id: "transactions", label: "Transactions", icon: DollarSign, href: "/dashboard-2/transactions" },
        { id: "classes", label: "Class Analytics", icon: Video, href: "/dashboard-2/classes" },
        { id: "settings", label: "Settings", icon: Settings, href: "/dashboard-2/settings" }
    ] : [
        { id: "home", label: "Home", icon: Home, href: "/dashboard-2" },
        { id: "book-classes", label: "Book Classes", icon: BookOpen, href: "/dashboard-2/book-classes" },
        { id: "join-class", label: "Join Class", icon: Video, href: "/dashboard-2/join-class" },
        { id: "my-teachers", label: "My Teachers", icon: Users, href: "/dashboard-2/my-teachers" },
        { id: "messages", label: "Messages", icon: MessageCircle, href: "/dashboard-2/messages" },
        { id: "settings", label: "Settings", icon: Settings, href: "/dashboard-2/settings" }
    ]

    // Render minimal layout for embedded video-call route (avoid nav and role checks UI)
    const isVideoCallRoute = pathname?.startsWith('/dashboard-2/video-call/')
    if (isVideoCallRoute) {
        return (
            <div className="min-h-screen bg-gray-50">{children}</div>
        )
    }

    // Show loading state while determining user type for regular dashboard routes
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

    return (
        <div className="flex flex-col lg:flex-row h-screen bg-gray-50">
            {/* Mobile Header */}
            <div className="lg:hidden bg-white border-b border-gray-200 p-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <Avatar className="h-10 w-10">
                            <AvatarImage src={avatarUrl} />
                            <AvatarFallback className="text-sm font-semibold">{initials(displayName)}</AvatarFallback>
                        </Avatar>
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900">{displayName}</h2>
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
                        const isActive = pathname === item.href
                        return (
                            <Link
                                key={item.id}
                                href={item.href}
                                className={`flex-shrink-0 flex flex-col items-center space-y-1 px-3 py-2 rounded-lg text-xs transition-all ${isActive
                                    ? "bg-blue-600 text-white"
                                    : "text-gray-600 hover:bg-gray-100"
                                    }`}
                            >
                                <Icon className={`h-5 w-5 ${isActive ? "text-white" : "text-gray-500"}`} />
                                <span className="font-medium whitespace-nowrap">{item.label}</span>
                            </Link>
                        )
                    })}
                </div>
            </div>

            {/* Left Sidebar - Hidden on Mobile */}
            <div className="hidden lg:flex w-55 bg-gray-50 border-r border-gray-200 flex-col">
                {/* Profile Header */}
                <div className="p-6 border-b border-gray-200">
                    <div className="text-center">
                        <Link
                            href="/dashboard-2/settings"
                            className="group transition-transform hover:scale-105"
                        >
                            <Avatar className="h-16 w-16 mx-auto mb-3 group-hover:ring-2 group-hover:ring-blue-300 transition-all">
                                <AvatarImage src={avatarUrl} />
                                <AvatarFallback className="text-lg font-semibold">{initials(displayName)}</AvatarFallback>
                            </Avatar>
                            <h2 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                                {displayName}
                            </h2>
                            <p className="text-sm text-gray-500 capitalize">{userType}</p>
                        </Link>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 p-4 space-y-2">
                    {navigationItems.map((item) => {
                        const Icon = item.icon
                        const isActive = pathname === item.href

                        return (
                            <Link
                                key={item.id}
                                href={item.href}
                                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-all duration-200 ${isActive
                                    ? "bg-blue-600 text-white shadow-sm"
                                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                                    }`}
                            >
                                <Icon className={`h-5 w-5 ${isActive ? "text-white" : "text-gray-500"}`} />
                                <span className="font-medium">{item.label}</span>
                            </Link>
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
                    {children}
                </div>
            </div>
        </div>
    )
}
