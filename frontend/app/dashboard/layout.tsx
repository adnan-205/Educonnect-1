"use client"

import { useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useUser } from "@clerk/nextjs"
import Link from "next/link"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import {
    Home,
    BookOpen,
    Users,
    DollarSign,
    Video,
    User,
    Star,
    CreditCard,
    Flag
} from "lucide-react"
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
    const [reportDialogOpen, setReportDialogOpen] = useState(false)
    const [reportType, setReportType] = useState<string>("")
    const [reportMessage, setReportMessage] = useState("")
    const [reportSubmitting, setReportSubmitting] = useState(false)
    const { toast } = useToast()

    const handleReportSubmit = async () => {
        if (!reportType || !reportMessage.trim()) {
            toast({ title: "Missing info", description: "Please select a category and describe the issue.", variant: "destructive" })
            return
        }
        setReportSubmitting(true)
        try {
            // For now, we'll just show a success message
            // In production, this would send to a backend endpoint or email service
            await new Promise(resolve => setTimeout(resolve, 500))
            toast({ title: "Report submitted", description: "Thank you for your feedback. We'll look into this issue." })
            setReportDialogOpen(false)
            setReportType("")
            setReportMessage("")
        } catch {
            toast({ title: "Error", description: "Failed to submit report. Please try again.", variant: "destructive" })
        } finally {
            setReportSubmitting(false)
        }
    }

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
        { id: "payment-settings", label: "Payment Methods", icon: CreditCard, href: "/dashboard/payment-settings" }
    ] : userType === "admin" ? [
        { id: "home", label: "Admin Dashboard", icon: Home, href: "/dashboard" },
        { id: "users", label: "User Management", icon: Users, href: "/dashboard/users" },
        { id: "transactions", label: "Transactions", icon: DollarSign, href: "/dashboard/transactions" },
        { id: "classes", label: "Class Analytics", icon: Video, href: "/dashboard/classes" }
    ] : [
        { id: "home", label: "Home", icon: Home, href: "/dashboard" },
        { id: "book-classes", label: "Explore", icon: BookOpen, href: "/dashboard/book-classes" },
        { id: "join-class", label: "Join Class", icon: Video, href: "/dashboard/join-class" },
        { id: "my-teachers", label: "My Teachers", icon: Users, href: "/dashboard/my-teachers" }
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
        <div className="flex flex-col lg:flex-row h-screen bg-background">
            {/* Mobile Header */}
            <div className="lg:hidden bg-card border-b border-border p-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <Avatar className="h-10 w-10">
                            <AvatarImage src={avatarUrl} />
                            <AvatarFallback className="text-sm font-semibold">{initials(displayName)}</AvatarFallback>
                        </Avatar>
                        <div>
                            <h2 className="text-lg font-semibold text-foreground">{displayName}</h2>
                            <p className="text-sm text-muted-foreground capitalize">{userType}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile Navigation */}
            <div className="lg:hidden bg-muted/50 border-b border-border p-2">
                <div className="flex overflow-x-auto space-x-2 pb-2">
                    {navigationItems.map((item) => {
                        const Icon = item.icon
                        const isActive = pathname === item.href
                        return (
                            <Link
                                key={item.id}
                                href={item.href}
                                className={`flex-shrink-0 flex flex-col items-center space-y-1 px-3 py-2 rounded-lg text-xs transition-all ${isActive
                                    ? "bg-primary text-primary-foreground"
                                    : "text-muted-foreground hover:bg-muted"
                                    }`}
                            >
                                <Icon className={`h-5 w-5 ${isActive ? "text-primary-foreground" : "text-muted-foreground"}`} />
                                <span className="font-medium whitespace-nowrap">{item.label}</span>
                            </Link>
                        )
                    })}
                </div>
            </div>

            {/* Left Sidebar - Hidden on Mobile */}
            <div className="hidden lg:flex w-55 bg-card border-r border-border flex-col">
                {/* Profile Header */}
                <div className="p-6 border-b border-border">
                    <div className="text-center">
                        <Link
                            href="/dashboard"
                            className="group transition-transform hover:scale-105"
                        >
                            <Avatar className="h-16 w-16 mx-auto mb-3 group-hover:ring-2 group-hover:ring-primary/50 transition-all">
                                <AvatarImage src={avatarUrl} />
                                <AvatarFallback className="text-lg font-semibold">{initials(displayName)}</AvatarFallback>
                            </Avatar>
                            <h2 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
                                {displayName}
                            </h2>
                            <p className="text-sm text-muted-foreground capitalize">{userType}</p>
                        </Link>
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

                {/* Report Button */}
                <div className="p-4 border-t border-border">
                    <Button
                        variant="outline"
                        className="w-full flex items-center justify-center gap-2"
                        onClick={() => setReportDialogOpen(true)}
                    >
                        <Flag className="h-4 w-4" />
                        Report a Problem
                    </Button>
                </div>

            </div>

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

            {/* Floating Report Button for Mobile */}
            <Button
                variant="outline"
                size="icon"
                className="lg:hidden fixed bottom-4 right-4 h-12 w-12 rounded-full shadow-lg bg-background z-50"
                onClick={() => setReportDialogOpen(true)}
            >
                <Flag className="h-5 w-5" />
            </Button>

            {/* Report Dialog */}
            <Dialog open={reportDialogOpen} onOpenChange={setReportDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Report a Problem</DialogTitle>
                        <DialogDescription>
                            Let us know about any issues you're experiencing. We'll look into it as soon as possible.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Category</Label>
                            <Select value={reportType} onValueChange={setReportType}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select issue type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="payment">Payment Issue</SelectItem>
                                    <SelectItem value="class">Class/Meeting Issue</SelectItem>
                                    <SelectItem value="account">Account Problem</SelectItem>
                                    <SelectItem value="booking">Booking Problem</SelectItem>
                                    <SelectItem value="bug">Bug/Technical Issue</SelectItem>
                                    <SelectItem value="other">Other</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Describe the issue</Label>
                            <Textarea
                                placeholder="Please describe what happened..."
                                value={reportMessage}
                                onChange={(e) => setReportMessage(e.target.value)}
                                rows={4}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setReportDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleReportSubmit} disabled={reportSubmitting}>
                            {reportSubmitting ? "Submitting..." : "Submit Report"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
