"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Search, Star, Clock, BookOpen, Code, Languages, FlaskConical } from "lucide-react"

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
    },
]

export default function BrowsePage() {
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
    const [searchQuery, setSearchQuery] = useState("")
    const [priceRange, setPriceRange] = useState("all")

    if (!selectedCategory) {
        // Show category grid
        return (
            <div className="container mx-auto px-4 py-10">
                <div className="text-center">
                    <div className="max-w-2xl mx-auto mb-12">
                        <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                            Browse by Category
                        </h1>
                        <p className="text-xl text-muted-foreground mb-6">
                            Choose a category to discover amazing gigs and teachers.
                        </p>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-3xl mx-auto">
                        {categories.map((cat) => {
                            const Icon = cat.icon
                            return (
                                <Card
                                    key={cat.key}
                                    className="flex flex-col items-center justify-center p-8 cursor-pointer border-2 transition-transform hover:scale-105 hover:border-primary/40 bg-white/80 dark:bg-gray-900/80 shadow-md hover:shadow-xl"
                                    onClick={() => setSelectedCategory(cat.key)}
                                >
                                    <div className="w-20 h-20 rounded-full flex items-center justify-center mb-4 bg-gradient-to-br from-blue-100 via-white to-purple-100 dark:from-blue-900 dark:via-gray-800 dark:to-purple-900">
                                        <Icon className="h-10 w-10 text-primary" />
                                    </div>
                                    <div className="text-lg font-semibold mb-1">{cat.label}</div>
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
                <Button variant="outline" onClick={() => setSelectedCategory(null)}>
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
            <div className="grid gap-6">
                {filteredGigs.length === 0 ? (
                    <div className="text-center text-muted-foreground py-12">No gigs found in this category.</div>
                ) : (
                    filteredGigs.map((gig) => (
                        <Card key={gig.id} className="hover:shadow-lg transition-shadow">
                            <CardContent className="p-6">
                                <div className="flex gap-6">
                                    <img
                                        src={gig.image || "/placeholder.svg"}
                                        alt={gig.teacher}
                                        className="w-16 h-16 rounded-full object-cover"
                                    />
                                    <div className="flex-1">
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <h3 className="text-xl font-semibold mb-1">{gig.title}</h3>
                                                <p className="text-muted-foreground">by {gig.teacher}</p>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-2xl font-bold text-primary">${gig.price}</div>
                                                <div className="text-sm text-muted-foreground">per hour</div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4 mb-3">
                                            <Badge variant="secondary">{categoryLabel}</Badge>
                                            <div className="flex items-center gap-1">
                                                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                                <span className="font-medium">{gig.rating}</span>
                                                <span className="text-muted-foreground">({gig.reviews} reviews)</span>
                                            </div>
                                            <div className="flex items-center gap-1 text-muted-foreground">
                                                <Clock className="h-4 w-4" />
                                                {gig.duration} min
                                            </div>
                                        </div>
                                        <p className="text-muted-foreground mb-4">{gig.description}</p>
                                        <div className="flex justify-between items-center">
                                            <div className="text-sm text-muted-foreground">Next available: {gig.nextAvailable}</div>
                                            <div className="flex gap-2">
                                                <Button variant="outline">View Profile</Button>
                                                <Button>Book Now</Button>
                                            </div>
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