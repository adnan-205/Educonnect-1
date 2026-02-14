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
    Star,
    Menu,
    LogOut,
    MoreHorizontal
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ThemeProvider } from "@/components/theme-provider"
import { ModeToggle } from "@/components/mode-toggle"

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
        const isVideoCallRoute = typeof window !== "undefined" && window.location.pathname.startsWith("/dashboard/video-call/")
        if (!isSignedIn && !isVideoCallRoute) {
            router.replace("/sign-in")
            return
        }
        // Allow joining embedded video call even if role not yet set
        const role = typeof window !== "undefined" ? localStorage.getItem("role") : null
        if (!role && !isVideoCallRoute) {
            router.replace("/onboarding")
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
        } catch { }
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
                } catch { }
            }
        }
        if (typeof window !== 'undefined') {
            window.addEventListener('storage', onStorage)
            return () => window.removeEventListener('storage', onStorage)
        }
    }, [isLoaded, isSignedIn, user])

    const initials = (name: string) => name ? name.split(' ').map(n => n[0]).join('').toUpperCase() : 'U'

    const navigationItems = userType === "teacher" ? [
        { id: "home", label: "Dashboard", icon: Home, href: "/dashboard" },
        { id: "profile", label: "Profile", icon: User, href: "/dashboard/profile" },
        { id: "bookings", label: "Bookings", icon: BookOpen, href: "/dashboard/bookings" },
        { id: "my-classes", label: "My Classes", icon: Video, href: "/dashboard/my-classes" },
        { id: "students", label: "My Students", icon: Users, href: "/dashboard/students" },
        { id: "gigs", label: "My Gigs", icon: Star, href: "/dashboard/gigs" },
        { id: "earnings", label: "Earnings", icon: DollarSign, href: "/dashboard/earnings" },
        { id: "messages", label: "Messages", icon: MessageCircle, href: "/dashboard/messages" },
        { id: "settings", label: "Settings", icon: Settings, href: "/dashboard/settings" }
    ] : userType === "admin" ? [
        { id: "home", label: "Admin Dashboard", icon: Home, href: "/dashboard" },
        { id: "users", label: "User Management", icon: Users, href: "/dashboard/users" },
        { id: "transactions", label: "Transactions", icon: DollarSign, href: "/dashboard/transactions" },
        { id: "classes", label: "Class Analytics", icon: Video, href: "/dashboard/classes" },
        { id: "settings", label: "Settings", icon: Settings, href: "/dashboard/settings" }
    ] : [
        { id: "home", label: "Home", icon: Home, href: "/dashboard" },
        { id: "book-classes", label: "Explore", icon: BookOpen, href: "/dashboard/book-classes" },
        { id: "join-class", label: "Join Class", icon: Video, href: "/dashboard/join-class" },
        { id: "my-teachers", label: "Teachers", icon: Users, href: "/dashboard/my-teachers" },
        { id: "messages", label: "Messages", icon: MessageCircle, href: "/dashboard/messages" },
        { id: "settings", label: "Settings", icon: Settings, href: "/dashboard/settings" }
    ]

    // Render minimal layout for embedded video-call route (avoid nav and role checks UI)
    const isVideoCallRoute = pathname?.startsWith('/dashboard/video-call/')
    if (isVideoCallRoute) {
        return (
            <div className="min-h-screen bg-background">{children}</div>
        )
    }

    // Show loading state while determining user type for regular dashboard routes
    if (userType === null) {
        return (
            <div className="flex h-screen bg-background items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Loading dashboard...</p>
                </div>
            </div>
        )
    }

    // Mobile Bottom Navigation (showing only top 4 + More menu if needed)
    // We'll prioritize the most important actions for mobile
    const mobileNavItems = navigationItems.slice(0, 4);
    const isMoreNeeded = navigationItems.length > 4;

    return (
        <div className="flex min-h-screen bg-background font-sans">
            {/* Desktop Sidebar */}
            <aside className="hidden lg:flex w-72 flex-col fixed inset-y-0 z-50 bg-background border-r border-border/40 transition-all duration-300">
                <div className="p-6 flex items-center gap-3">
                    <div className="bg-primary/10 p-2 rounded-xl">
                        <BookOpen className="h-6 w-6 text-primary" />
                    </div>
                    <span className="font-bold text-xl tracking-tight">EduConnect</span>
                </div>

                <nav className="flex-1 px-4 py-4 space-y-1">
                    {navigationItems.map((item) => {
                        const Icon = item.icon
                        const isActive = pathname === item.href

                        return (
                            <Link
                                key={item.id}
                                href={item.href}
                                className={`
                                    flex items-center gap-3 px-4 py-3 rounded-full text-sm font-medium transition-all duration-200
                                    ${isActive
                                        ? "bg-primary/10 text-primary font-semibold"
                                        : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                                    }
                                `}
                            >
                                <Icon className={`h-5 w-5 ${isActive ? "text-primary" : "text-muted-foreground"}`} />
                                {item.label}
                            </Link>
                        )
                    })}
                </nav>

                {/* User Profile Footer in Sidebar */}
                <div className="p-4 border-t border-border/40">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="w-full flex items-center justify-start gap-3 px-2 h-auto py-2 hover:bg-muted/50 rounded-xl">
                                <Avatar className="h-9 w-9 border border-border/50">
                                    <AvatarImage src={avatarUrl} />
                                    <AvatarFallback>{initials(displayName)}</AvatarFallback>
                                </Avatar>
                                <div className="text-left flex-1 overflow-hidden">
                                    <p className="text-sm font-medium truncate">{displayName}</p>
                                    <p className="text-xs text-muted-foreground capitalize truncate">{userType}</p>
                                </div>
                                <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56 mb-2">
                            <DropdownMenuLabel>My Account</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => router.push('/dashboard/profile')}>
                                <User className="mr-2 h-4 w-4" /> Profile
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => router.push('/dashboard/settings')}>
                                <Settings className="mr-2 h-4 w-4" /> Settings
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <div className="px-2 py-1.5 flex items-center justify-between">
                                <span className="text-sm">Theme</span>
                                <ModeToggle />
                            </div>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-500 focus:text-red-500" onClick={() => router.push('/logout')}>
                                <LogOut className="mr-2 h-4 w-4" /> Sign out
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 lg:pl-72 flex flex-col min-h-screen">
                {/* Mobile Header */}
                <header className="lg:hidden sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border/40 px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="bg-primary/10 p-1.5 rounded-lg">
                            <BookOpen className="h-5 w-5 text-primary" />
                        </div>
                        <span className="font-bold text-lg">EduConnect</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <ModeToggle />
                        <Link href="/dashboard/profile">
                            <Avatar className="h-8 w-8">
                                <AvatarImage src={avatarUrl} />
                                <AvatarFallback>{initials(displayName)}</AvatarFallback>
                            </Avatar>
                        </Link>
                    </div>
                </header>

                <div className="flex-1 p-4 lg:p-8 max-w-7xl mx-auto w-full pb-20 lg:pb-8">
                    {children}
                </div>
            </main>

            {/* Mobile Bottom Navigation */}
            <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-lg border-t border-border/40 pb-safe">
                <div className="flex items-center justify-around h-16 px-2">
                    {mobileNavItems.map((item) => {
                        const Icon = item.icon
                        const isActive = pathname === item.href
                        return (
                            <Link
                                key={item.id}
                                href={item.href}
                                className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
                            >
                                <div className={`p-1.5 rounded-full transition-all ${isActive ? "bg-primary/10" : "bg-transparent"}`}>
                                    <Icon className={`h-5 w-5 ${isActive ? "fill-primary/20" : ""}`} />
                                </div>
                                <span className="text-[10px] font-medium">{item.label}</span>
                            </Link>
                        )
                    })}
                    {isMoreNeeded && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button className="flex flex-col items-center justify-center w-full h-full space-y-1 text-muted-foreground hover:text-foreground">
                                    <div className="p-1.5 rounded-full bg-transparent">
                                        <Menu className="h-5 w-5" />
                                    </div>
                                    <span className="text-[10px] font-medium">Menu</span>
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="mb-2 w-48">
                                {navigationItems.slice(4).map((item) => {
                                    const Icon = item.icon
                                    return (
                                        <DropdownMenuItem key={item.id} asChild>
                                            <Link href={item.href} className="w-full cursor-pointer">
                                                <Icon className="mr-2 h-4 w-4" /> {item.label}
                                            </Link>
                                        </DropdownMenuItem>
                                    )
                                })}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                </div>
            </nav>
        </div>
    )
}
