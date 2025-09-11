"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Search, Star, Clock, BookOpen, Code, Languages, FlaskConical, Loader2 } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { gigsApi } from "@/services/api"

// Type definitions
interface Gig {
  _id: string
  title: string
  description: string
  category: string
  price: number
  duration: string
  createdAt: string
  teacher: {
    _id: string
    name: string
    email: string
  }
}

const categories = [
    { key: "Mathematics", label: "Mathematics", icon: BookOpen },
    { key: "Programming", label: "Programming", icon: Code },
    { key: "Languages", label: "Languages", icon: Languages },
    { key: "Science", label: "Science", icon: FlaskConical },
]

export default function BrowsePage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
    const [searchQuery, setSearchQuery] = useState("")
    const [priceRange, setPriceRange] = useState("all")
    const [loading, setLoading] = useState(false)
    const [gigs, setGigs] = useState<Gig[]>([])
    const [error, setError] = useState("")

    // Initialize category from URL (e.g., /browse?category=mathematics)
    useEffect(() => {
        const cat = searchParams.get("category")
        if (cat && cat !== selectedCategory) {
            setSelectedCategory(cat)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchParams])

    // Load gigs when category changes
    useEffect(() => {
        if (!selectedCategory) return
        loadGigs()
    }, [selectedCategory])

    const loadGigs = async () => {
        try {
            setLoading(true)
            setError("")
            const response = await gigsApi.getAllGigs()
            setGigs(response.data || [])
        } catch (error: any) {
            console.error("Error loading gigs:", error)
            setError("Failed to load gigs. Please try again.")
        } finally {
            setLoading(false)
        }
    }

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
        gig.category.toLowerCase() === selectedCategory?.toLowerCase() &&
        (gig.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            gig.teacher.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            gig.category.toLowerCase().includes(searchQuery.toLowerCase())) &&
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

            {/* Error Alert */}
            {error && (
                <Alert variant="destructive" className="mb-6">
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}
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
                        <div className="flex gap-4 w-full md:w-auto">
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
                    </div>
                </CardContent>
            </Card>
            {/* Available Gigs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {loading ? (
                    Array.from({ length: 6 }).map((_, i) => (
                        <Card key={i} className="overflow-hidden rounded-2xl">
                            <div className="aspect-video w-full animate-pulse bg-muted" />
                            <CardContent className="p-4">
                                <div className="h-4 w-24 bg-muted animate-pulse rounded mb-2" />
                                <div className="h-5 w-3/4 bg-muted animate-pulse rounded mb-3" />
                                <div className="h-4 w-1/2 bg-muted animate-pulse rounded" />
                            </CardContent>
                        </Card>
                    ))
                ) : filteredGigs.length === 0 ? (
                    <div className="col-span-full text-center text-muted-foreground py-12">
                        {error ? "Failed to load gigs. Please try again." : "No gigs found in this category."}
                    </div>
                ) : (
                    filteredGigs.map((gig) => (
                        <Card key={gig._id} className="overflow-hidden rounded-2xl hover:shadow-lg transition-shadow">
                            <div className="aspect-video w-full overflow-hidden bg-gradient-to-br from-primary/10 to-purple-500/10">
                                <div className="w-full h-full flex items-center justify-center">
                                    <BookOpen className="h-12 w-12 text-primary/50" />
                                </div>
                            </div>
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs rounded-full bg-primary/10 text-primary px-2 py-0.5">{gig.category}</span>
                                    <div className="text-xs text-muted-foreground">${gig.price}/hr</div>
                                </div>
                                <div className="font-semibold leading-snug mb-1 line-clamp-2">{gig.title}</div>
                                <div className="text-sm text-muted-foreground mb-3">by {gig.teacher.name}</div>
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-1 text-amber-500 text-sm">
                                        <Star className="h-4 w-4 fill-current" />
                                        <span>4.8</span>
                                        <span className="text-muted-foreground">(12)</span>
                                    </div>
                                    <div className="flex items-center gap-1 text-muted-foreground text-sm">
                                        <Clock className="h-4 w-4" />
                                        {gig.duration} min
                                    </div>
                                </div>
                                <div className="mb-3">
                                    <p className="text-sm text-muted-foreground line-clamp-2">{gig.description}</p>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="text-xs text-muted-foreground">
                                        Created: {new Date(gig.createdAt).toLocaleDateString()}
                                    </div>
                                    <div className="flex gap-2">
                                        <Link href={`/teacher/${gig.teacher._id}`}>
                                            <Button variant="outline" size="sm">View Profile</Button>
                                        </Link>
                                        <Link href={`/book/${gig._id}`}>
                                            <Button size="sm">Book Now</Button>
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