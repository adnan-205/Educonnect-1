"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { gigsApi } from "@/services/api"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
    Search,
    Filter,
    Star,
    Clock,
    Users,
    Video,
    Calendar,
    BookOpen
} from "lucide-react"

interface Gig {
    _id: string
    title: string
    description: string
    category: string
    price: number
    duration: number
    averageRating?: number
    reviewsCount?: number
    teacher: {
        _id: string
        name: string
        email: string
        profileImage?: string
    }
    tags?: string[]
    createdAt: string
}

export default function BookClassesPage() {
    const router = useRouter()
    const [gigs, setGigs] = useState<Gig[]>([])
    const [filteredGigs, setFilteredGigs] = useState<Gig[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")
    const [selectedCategory, setSelectedCategory] = useState("all")
    const [priceRange, setPriceRange] = useState("all")
    const { toast } = useToast()

    const categories = [
        "Mathematics", "Science", "English", "History", "Geography",
        "Physics", "Chemistry", "Biology", "Computer Science", "Art"
    ]

    useEffect(() => {
        fetchGigs()
    }, [])

    useEffect(() => {
        filterGigs()
    }, [filterGigs])

    const fetchGigs = async () => {
        try {
            const response = await gigsApi.getAllGigs()
            setGigs(response.data || [])
        } catch (error) {
            console.error("Error fetching gigs:", error)
            toast({
                title: "Error",
                description: "Failed to load classes. Please try again.",
                variant: "destructive"
            })
        } finally {
            setLoading(false)
        }
    }

    const filterGigs = useCallback(() => {
        let filtered = gigs

        // Search filter
        if (searchTerm) {
            const q = searchTerm.toLowerCase()
            filtered = filtered.filter(gig =>
                gig.title.toLowerCase().includes(q) ||
                gig.description.toLowerCase().includes(q) ||
                gig.teacher.name.toLowerCase().includes(q) ||
                (Array.isArray(gig.tags) && gig.tags.some(tag => tag.toLowerCase().includes(q)))
            )
        }

        // Category filter
        if (selectedCategory !== "all") {
            filtered = filtered.filter(gig => gig.category === selectedCategory)
        }

        // Price filter
        if (priceRange !== "all") {
            const [min, max] = priceRange.split("-").map(Number)
            filtered = filtered.filter(gig => {
                if (max) {
                    return gig.price >= min && gig.price <= max
                } else {
                    return gig.price >= min
                }
            })
        }

        setFilteredGigs(filtered)
    }, [gigs, searchTerm, selectedCategory, priceRange])

    const handleBookClass = (gigId: string) => {
        // Route to booking page where student selects date/time
        router.push(`/book/${gigId}`)
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading available classes...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Book Classes</h1>
                    <p className="text-gray-600 mt-1">Find and book classes with expert teachers</p>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                    <BookOpen className="h-4 w-4" />
                    <span>{filteredGigs.length} classes available</span>
                </div>
            </div>

            {/* Search and Filters */}
            <Card>
                <CardContent className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                            <Input
                                placeholder="Search classes, teachers, or topics..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                        
                        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                            <SelectTrigger>
                                <SelectValue placeholder="All Categories" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Categories</SelectItem>
                                {categories.map(category => (
                                    <SelectItem key={category} value={category}>
                                        {category}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Select value={priceRange} onValueChange={setPriceRange}>
                            <SelectTrigger>
                                <SelectValue placeholder="Price Range" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Prices</SelectItem>
                                <SelectItem value="0-25">৳0 - ৳25</SelectItem>
                                <SelectItem value="25-50">৳25 - ৳50</SelectItem>
                                <SelectItem value="50-100">৳50 - ৳100</SelectItem>
                                <SelectItem value="100">৳100+</SelectItem>
                            </SelectContent>
                        </Select>

                        <Button variant="outline" className="flex items-center gap-2">
                            <Filter className="h-4 w-4" />
                            More Filters
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Classes Grid */}
            {filteredGigs.length === 0 ? (
                <Card>
                    <CardContent className="p-12 text-center">
                        <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">No classes found</h3>
                        <p className="text-gray-600">Try adjusting your search criteria or check back later for new classes.</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredGigs.map((gig) => (
                        <Card key={gig._id} className="hover:shadow-lg transition-shadow">
                            <CardHeader className="pb-3">
                                <div className="flex items-start justify-between">
                                    <Badge variant="secondary" className="mb-2">
                                        {gig.category}
                                    </Badge>
                                    <div className="flex items-center gap-1 text-sm text-yellow-600">
                                        <Star className="h-4 w-4 fill-current" />
                                        <span>{(gig.averageRating ?? 0).toFixed(1)}</span>
                                        <span className="text-gray-500">({gig.reviewsCount ?? 0})</span>
                                    </div>
                                </div>
                                <CardTitle className="text-lg leading-tight">{gig.title}</CardTitle>
                            </CardHeader>
                            
                            <CardContent className="space-y-4">
                                <p className="text-gray-600 text-sm line-clamp-2">{gig.description}</p>
                                
                                {/* Teacher Info */}
                                <div className="flex items-center gap-3">
                                    <Avatar className="h-8 w-8">
                                        <AvatarImage src={gig.teacher.profileImage} />
                                        <AvatarFallback className="text-xs">
                                            {gig.teacher.name.split(' ').map(n => n[0]).join('')}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="font-medium text-sm">{gig.teacher.name}</p>
                                        <p className="text-xs text-gray-500">Expert Teacher</p>
                                        <div className="mt-1">
                                            <Link href={`/teachers/${gig.teacher._id}`} className="text-xs text-blue-600 hover:underline">
                                                View Full Profile
                                            </Link>
                                        </div>
                                    </div>
                                </div>

                                {/* Class Details */}
                                <div className="flex items-center justify-between text-sm text-gray-600">
                                    <div className="flex items-center gap-1">
                                        <Clock className="h-4 w-4" />
                                        <span>{gig.duration} min</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Users className="h-4 w-4" />
                                        <span>1-on-1</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Video className="h-4 w-4" />
                                        <span>Online</span>
                                    </div>
                                </div>

                                {/* Tags (optional) */}
                                {Array.isArray(gig.tags) && gig.tags.length > 0 && (
                                    <div className="flex flex-wrap gap-1">
                                        {gig.tags.slice(0, 3).map((tag, index) => (
                                            <Badge key={index} variant="outline" className="text-xs">
                                                {tag}
                                            </Badge>
                                        ))}
                                        {gig.tags.length > 3 && (
                                            <Badge variant="outline" className="text-xs">
                                                +{gig.tags.length - 3} more
                                            </Badge>
                                        )}
                                    </div>
                                )}

                                {/* Price and Book Button */}
                                <div className="flex items-center justify-between pt-2 border-t">
                                    <div className="flex items-center gap-1">
                                        <span className="h-4 w-4 text-green-600 leading-none">৳</span>
                                        <span className="text-lg font-bold text-green-600">{gig.price}</span>
                                        <span className="text-sm text-gray-500">/ session</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Link href={`/gigs/${gig._id}`} className="hidden sm:block">
                                            <Button variant="outline">View Details</Button>
                                        </Link>
                                        <Button onClick={() => handleBookClass(gig._id)} className="flex items-center gap-2">
                                            <Calendar className="h-4 w-4" />
                                            Book Now
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )
}
