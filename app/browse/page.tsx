"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Search, Star, Clock, BookOpen, Code, Languages, FlaskConical } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"

const categories = [
    { key: "mathematics", label: "Mathematics", icon: BookOpen },
    { key: "programming", label: "Programming", icon: Code },
    { key: "languages", label: "Languages", icon: Languages },
    { key: "science", label: "Science", icon: FlaskConical },
]

const gigs = [
    {
        id: 1,
        title: "Advanced Mathematics Tutoring",
        teacher: "Sarah Johnson",
        subject: "mathematics",
        price: 25,
        duration: 60,
        rating: 4.9,
        reviews: 45,
        description: "Comprehensive math tutoring for high school and college students.",
        image: "/placeholder.jpg",
        nextAvailable: "Today 2:00 PM",
        demoVideos: [
            {
                id: "1",
                title: "Calculus Fundamentals",
                description: "Introduction to derivatives",
                videoUrl: "https://www.youtube.com/watch?v=example1",
                duration: "8:45",
                subject: "Calculus",
                uploadDate: "2024-01-15",
                videoType: "external"
            }
        ]
    },
    {
        id: 2,
        title: "Python Programming for Beginners",
        teacher: "David Chen",
        subject: "programming",
        price: 35,
        duration: 90,
        rating: 4.8,
        reviews: 32,
        description: "Learn Python from scratch with hands-on projects.",
        image: "/placeholder.jpg",
        nextAvailable: "Tomorrow 10:00 AM",
        demoVideos: [
            {
                id: "2",
                title: "Python Basics",
                description: "Variables and data types",
                videoUrl: "https://www.youtube.com/watch?v=example2",
                duration: "12:30",
                subject: "Programming",
                uploadDate: "2024-01-10",
                videoType: "external"
            }
        ]
    },
    {
        id: 3,
        title: "Spanish Conversation Practice",
        teacher: "Maria Garcia",
        subject: "languages",
        price: 20,
        duration: 45,
        rating: 5.0,
        reviews: 67,
        description: "Improve your Spanish speaking skills with a native speaker.",
        image: "/placeholder.jpg",
        nextAvailable: "Today 4:00 PM",
        demoVideos: []
    },
]

export default function BrowsePage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
    const [searchQuery, setSearchQuery] = useState("")
    const [priceRange, setPriceRange] = useState("all")
    const [loading, setLoading] = useState(false)

    // Initialize category from URL (e.g., /browse?category=mathematics)
    useEffect(() => {
        const cat = searchParams.get("category")
        if (cat && cat !== selectedCategory) {
            setSelectedCategory(cat)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchParams])

    // Simulate dynamic loading when category changes
    useEffect(() => {
        if (!selectedCategory) return
        setLoading(true)
        const t = setTimeout(() => setLoading(false), 300)
        return () => clearTimeout(t)
    }, [selectedCategory])

    // NOTE: Removed Popular gigs (kept dynamic and clean per new design)

    if (!selectedCategory) {
        // Show category grid
        return (
            <div className="container mx-auto px-4 py-12">
                <div className="text-center">
                    <div className="max-w-3xl mx-auto mb-12">
                        <div className="inline-flex items-center rounded-full border bg-white/70 dark:bg-white/5 backdrop-blur px-3 py-1 text-xs text-muted-foreground mb-4">
                            Explore subjects
                        </div>
                        <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                            Browse by Category
                        </h1>
                        <p className="text-lg md:text-xl text-muted-foreground mb-6">
                            Pick a category to discover tailored gigs from expert teachers.
                        </p>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-5 sm:gap-6 max-w-4xl mx-auto">
                        {categories.map((cat) => {
                            const Icon = cat.icon
                            return (
                                <Card
                                    key={cat.key}
                                    className="group relative overflow-hidden border-2 hover:border-primary/30 transition-colors rounded-2xl"
                                    onClick={() => {
                                        setSelectedCategory(cat.key)
                                        router.push(`/browse?category=${cat.key}`)
                                    }}
                                >
                                    <div className="absolute -top-12 -right-12 h-24 w-24 rounded-full bg-gradient-to-br from-primary/10 to-purple-500/10 blur-2xl" />
                                    <div className="p-6 flex flex-col items-center text-center">
                                        <div className="h-14 w-14 rounded-xl grid place-items-center mb-3 bg-gradient-to-br from-primary/10 to-purple-500/10 text-primary">
                                            <Icon className="h-7 w-7" />
                                        </div>
                                        <div className="font-semibold text-base md:text-lg">
                                            {cat.label}
                                        </div>
                                        <div className="text-xs text-muted-foreground mt-1">Explore gigs</div>
                                        <div className="mt-4 opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-all text-sm text-primary inline-flex items-center gap-1">
                                            Explore <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                                        </div>
                                    </div>
                                </Card>
                            )
                        })}
                    </div>
                </div>
            </div>
        )
    }

    // Filter gigs by selected category
    const filteredGigs = gigs.filter((gig) =>
        gig.subject.toLowerCase() === selectedCategory &&
        (gig.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            gig.teacher.toLowerCase().includes(searchQuery.toLowerCase()) ||
            gig.subject.toLowerCase().includes(searchQuery.toLowerCase())) &&
        (priceRange === "all" ||
            (priceRange === "under25" && gig.price < 25) ||
            (priceRange === "25-35" && gig.price >= 25 && gig.price <= 35) ||
            (priceRange === "over35" && gig.price > 35))
    )

    const categoryLabel = categories.find((c) => c.key === selectedCategory)?.label

    return (
        <div className="container mx-auto px-4 py-10">
            <div className="flex items-center mb-8 gap-4">
                <Button
                    variant="outline"
                    onClick={() => {
                        setSelectedCategory(null)
                        router.push("/browse")
                    }}
                >
                    &larr; Back to Categories
                </Button>
                <h2 className="text-2xl font-bold">{categoryLabel} Gigs</h2>
            </div>
            {/* Search and Filters */}
            <Card className="mb-8">
                <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder={`Search in ${categoryLabel}...`}
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <Select value={priceRange} onValueChange={setPriceRange}>
                                <SelectTrigger className="w-40">
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
                    </div>
                </CardContent>
            </Card>
            {/* Available Gigs */}
            {loading && (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <Card key={i} className="overflow-hidden rounded-2xl">
                            <div className="aspect-video w-full animate-pulse bg-muted" />
                            <CardContent className="p-4">
                                <div className="h-4 w-24 bg-muted animate-pulse rounded mb-2" />
                                <div className="h-5 w-3/4 bg-muted animate-pulse rounded mb-3" />
                                <div className="h-4 w-1/2 bg-muted animate-pulse rounded" />
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredGigs.length === 0 ? (
                    <div className="col-span-full text-center text-muted-foreground py-12">No gigs found in this category.</div>
                ) : (
                    filteredGigs.map((gig) => (
                        <Card key={gig.id} className="overflow-hidden rounded-2xl hover:shadow-lg transition-shadow">
                            <div className="aspect-video w-full overflow-hidden">
                                <img src={gig.image || "/placeholder.svg"} alt={gig.title} className="w-full h-full object-cover" />
                            </div>
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs rounded-full bg-primary/10 text-primary px-2 py-0.5">{categoryLabel}</span>
                                    <div className="text-xs text-muted-foreground">${gig.price}/hr</div>
                                </div>
                                <div className="font-semibold leading-snug mb-1 line-clamp-2">{gig.title}</div>
                                <div className="text-sm text-muted-foreground mb-3">by {gig.teacher}</div>
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-1 text-amber-500 text-sm">
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.802 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118L10.95 14.95a1 1 0 00-1.175 0l-2.987 2.132c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.153 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                                        <span>{gig.rating}</span>
                                        <span className="text-muted-foreground">({gig.reviews})</span>
                                    </div>
                                    <div className="flex items-center gap-1 text-muted-foreground text-sm">
                                        <Clock className="h-4 w-4" />
                                        {gig.duration} min
                                    </div>
                                </div>
                                {/* Demo Video Section */}
                                {gig.demoVideos && gig.demoVideos.length > 0 && (
                                    <div className="mb-3 p-2 bg-muted/30 rounded-lg">
                                        <div className="text-xs font-medium text-muted-foreground mb-2">Demo Videos</div>
                                        <div className="flex gap-2 overflow-x-auto">
                                            {gig.demoVideos.slice(0, 2).map((video) => (
                                                <div
                                                    key={video.id}
                                                    className="flex-shrink-0 flex items-center gap-2 text-xs text-primary hover:text-primary/80 cursor-pointer"
                                                    onClick={() => window.open(video.videoUrl, '_blank')}
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                    </svg>
                                                    {video.title}
                                                </div>
                                            ))}
                                            {gig.demoVideos.length > 2 && (
                                                <span className="text-xs text-muted-foreground">+{gig.demoVideos.length - 2} more</span>
                                            )}
                                        </div>
                                    </div>
                                )}

                                <div className="flex items-center justify-between">
                                    <div className="text-xs text-muted-foreground">Next: {gig.nextAvailable}</div>
                                    <div className="flex gap-2">
                                        <Button variant="outline" size="sm">View Profile</Button>
                                        <Button size="sm">Book Now</Button>
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