"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Search, Star, Clock, DollarSign, Users, BookOpen } from "lucide-react"
import Link from "next/link"

interface Gig {
  id: number
  title: string
  subject: string
  teacher: {
    name: string
    avatar?: string
    rating: number
    totalStudents: number
  }
  price: number
  duration: number
  description: string
  tags: string[]
  rating: number
  totalBookings: number
}

interface GigSearchProps {
  className?: string
}

export function GigSearch({ className }: GigSearchProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<Gig[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showResults, setShowResults] = useState(false)
  // Simple filters
  const [selectedSubject, setSelectedSubject] = useState("")
  const [selectedTopic, setSelectedTopic] = useState("")
  const [maxPrice, setMaxPrice] = useState("")
  const [minRating, setMinRating] = useState("")

  // Mock gigs data - in a real app, this would come from an API
  const mockGigs: Gig[] = [
    {
      id: 1,
      title: "Advanced Mathematics Tutoring",
      subject: "Mathematics",
      teacher: {
        name: "Sarah Johnson",
        avatar: "",
        rating: 4.9,
        totalStudents: 150
      },
      price: 45,
      duration: 60,
      description: "Comprehensive math tutoring covering algebra, calculus, and statistics for high school and college students.",
      tags: ["mathematics", "algebra", "calculus", "statistics", "trigonometry"],
      rating: 4.9,
      totalBookings: 89
    },
    {
      id: 2,
      title: "Python Programming for Beginners",
      subject: "Programming",
      teacher: {
        name: "Mike Chen",
        avatar: "",
        rating: 4.8,
        totalStudents: 120
      },
      price: 35,
      duration: 90,
      description: "Learn Python from scratch with hands-on projects and real-world applications.",
      tags: ["python", "programming", "coding", "software development", "web development"],
      rating: 4.8,
      totalBookings: 76
    },
    {
      id: 3,
      title: "English Literature & Writing",
      subject: "English",
      teacher: {
        name: "Emma Wilson",
        avatar: "",
        rating: 4.7,
        totalStudents: 95
      },
      price: 30,
      duration: 75,
      description: "Improve your writing skills and explore classic and modern literature.",
      tags: ["english", "literature", "writing", "essay", "grammar", "reading"],
      rating: 4.7,
      totalBookings: 54
    },
    {
      id: 4,
      title: "Physics - Mechanics & Thermodynamics",
      subject: "Physics",
      teacher: {
        name: "Dr. James Rodriguez",
        avatar: "",
        rating: 4.9,
        totalStudents: 80
      },
      price: 50,
      duration: 60,
      description: "Master physics concepts with clear explanations and problem-solving techniques.",
      tags: ["physics", "mechanics", "thermodynamics", "science", "engineering"],
      rating: 4.9,
      totalBookings: 67
    },
    {
      id: 5,
      title: "Spanish Conversation & Grammar",
      subject: "Languages",
      teacher: {
        name: "Maria Garcia",
        avatar: "",
        rating: 4.8,
        totalStudents: 110
      },
      price: 25,
      duration: 45,
      description: "Learn Spanish through conversation practice and structured grammar lessons.",
      tags: ["spanish", "language", "conversation", "grammar", "vocabulary"],
      rating: 4.8,
      totalBookings: 92
    },
    {
      id: 6,
      title: "Chemistry - Organic & Inorganic",
      subject: "Chemistry",
      teacher: {
        name: "Dr. Lisa Park",
        avatar: "",
        rating: 4.6,
        totalStudents: 65
      },
      price: 40,
      duration: 60,
      description: "Comprehensive chemistry tutoring covering both organic and inorganic chemistry.",
      tags: ["chemistry", "organic", "inorganic", "science", "lab", "reactions"],
      rating: 4.6,
      totalBookings: 43
    }
  ]

  const subjects = Array.from(new Set(mockGigs.map(g => g.subject)))

  const applyFilters = (items: Gig[]) => {
    return items.filter(gig => {
      const okSubject = !selectedSubject || gig.subject === selectedSubject
      const okTopic = !selectedTopic || gig.tags.some(t => t.toLowerCase().includes(selectedTopic.toLowerCase()))
      const okPrice = !maxPrice || gig.price <= Number(maxPrice)
      const okRating = !minRating || gig.rating >= Number(minRating)
      return okSubject && okTopic && okPrice && okRating
    })
  }

  const handleSearch = (query: string) => {
    setSearchQuery(query)
    setIsSearching(true)
    
    if (query.trim() === "") {
      setSearchResults([])
      setShowResults(false)
      setIsSearching(false)
      return
    }

    // Simulate API delay
    setTimeout(() => {
      const results = mockGigs.filter(gig => {
        const searchTerm = query.toLowerCase()
        return (
          gig.title.toLowerCase().includes(searchTerm) ||
          gig.subject.toLowerCase().includes(searchTerm) ||
          gig.description.toLowerCase().includes(searchTerm) ||
          gig.tags.some(tag => tag.toLowerCase().includes(searchTerm)) ||
          gig.teacher.name.toLowerCase().includes(searchTerm)
        )
      })
      const filtered = applyFilters(results)
      setSearchResults(filtered)
      setShowResults(true)
      setIsSearching(false)
    }, 300)
  }

  // Re-apply filters when filter values change
  useEffect(() => {
    if (!showResults || !searchQuery.trim()) return
    const searchTerm = searchQuery.toLowerCase()
    const base = mockGigs.filter(gig => (
      gig.title.toLowerCase().includes(searchTerm) ||
      gig.subject.toLowerCase().includes(searchTerm) ||
      gig.description.toLowerCase().includes(searchTerm) ||
      gig.tags.some(tag => tag.toLowerCase().includes(searchTerm)) ||
      gig.teacher.name.toLowerCase().includes(searchTerm)
    ))
    setSearchResults(applyFilters(base))
  }, [selectedSubject, selectedTopic, maxPrice, minRating])

  const clearFilters = () => {
    setSelectedSubject("")
    setSelectedTopic("")
    setMaxPrice("")
    setMinRating("")
    if (searchQuery.trim()) {
      handleSearch(searchQuery)
    }
  }

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase()
  }

  return (
    <div className={`w-full max-w-4xl mx-auto ${className}`}>
      {/* Heading */}
      <div className="mb-4 text-center">
        <h3 className="text-2xl md:text-3xl font-semibold tracking-tight">Search tutors, topics, and gigs</h3>
        <p className="text-sm md:text-base text-muted-foreground mt-1">Try keywords like "calculus", "python", or "spoken english"</p>
      </div>

      {/* Search Input */}
      <div className="relative mb-6">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
          <Input
            type="text"
            placeholder="Search for subjects, topics, or teachers..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-12 pr-4 h-14 text-base md:text-lg rounded-xl border-2 shadow-xl focus-visible:ring-2 focus-visible:ring-primary/40 focus:border-primary/60"
          />
        </div>
        {isSearching && (
          <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
          </div>
        )}
      </div>

      {/* Simple Filters */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-5 gap-3">
        <select
          value={selectedSubject}
          onChange={(e) => setSelectedSubject(e.target.value)}
          className="h-11 rounded-lg border bg-background px-3"
        >
          <option value="">All subjects</option>
          {subjects.map(subj => (
            <option key={subj} value={subj}>{subj}</option>
          ))}
        </select>
        <Input
          type="text"
          placeholder="Topic (e.g., calculus)"
          value={selectedTopic}
          onChange={(e) => setSelectedTopic(e.target.value)}
          className="h-11 rounded-lg border bg-background px-3"
        />
        <input
          type="number"
          inputMode="numeric"
          min={0}
          placeholder="Max price ($)"
          value={maxPrice}
          onChange={(e) => setMaxPrice(e.target.value)}
          className="h-11 rounded-lg border bg-background px-3"
        />
        <input
          type="number"
          inputMode="decimal"
          step="0.1"
          min={0}
          max={5}
          placeholder="Min rating"
          value={minRating}
          onChange={(e) => setMinRating(e.target.value)}
          className="h-11 rounded-lg border bg-background px-3"
        />
        <div className="flex md:justify-end">
          <Button variant="outline" className="w-full md:w-auto" onClick={clearFilters}>Clear Filters</Button>
        </div>
      </div>

      {/* Search Results */}
      {showResults && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-semibold">
              {searchResults.length > 0 
                ? `Found ${searchResults.length} result${searchResults.length !== 1 ? 's' : ''} for "${searchQuery}"`
                : `No results found for "${searchQuery}"`
              }
            </h3>
            {searchResults.length > 0 && (
              <Button variant="outline" onClick={() => setShowResults(false)}>
                Clear Results
              </Button>
            )}
          </div>

          {searchResults.length > 0 ? (
            <div className="grid gap-6">
              {searchResults.map((gig) => (
                <Card key={gig.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row gap-6">
                      {/* Teacher Info */}
                      <div className="flex items-center gap-4 md:w-1/3">
                        <Avatar className="w-16 h-16">
                          <AvatarImage src={gig.teacher.avatar} alt={gig.teacher.name} />
                          <AvatarFallback className="text-lg">
                            {getInitials(gig.teacher.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h4 className="font-semibold text-lg">{gig.teacher.name}</h4>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                              <span>{gig.teacher.rating}</span>
                            </div>
                            <span>•</span>
                            <div className="flex items-center gap-1">
                              <Users className="h-4 w-4" />
                              <span>{gig.teacher.totalStudents} students</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Gig Details */}
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="text-xl font-semibold mb-2">{gig.title}</h3>
                            <Badge variant="secondary" className="mb-2">
                              {gig.subject}
                            </Badge>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-primary">${gig.price}</div>
                            <div className="text-sm text-muted-foreground">per session</div>
                          </div>
                        </div>
                        
                        <p className="text-muted-foreground mb-4 line-clamp-2">{gig.description}</p>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              <span>{gig.duration} min</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <BookOpen className="h-4 w-4" />
                              <span>{gig.totalBookings} bookings</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                              <span>{gig.rating}</span>
                            </div>
                          </div>
                          
                          <div className="flex gap-2">
                            <Button variant="outline" asChild>
                              <Link href={`/teacher/${gig.teacher.name.toLowerCase().replace(' ', '-')}`}>
                                View Profile
                              </Link>
                            </Button>
                            <Button asChild>
                              <Link href={`/book/${gig.id}`}>
                                Book Session
                              </Link>
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : searchQuery && (
            <Card className="text-center p-8">
              <CardContent>
                <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No results found</h3>
                <p className="text-muted-foreground mb-4">
                  Try searching for different keywords like "math", "programming", "english", or "science"
                </p>
                <div className="flex flex-wrap gap-2 justify-center">
                  <Badge 
                    variant="outline" 
                    className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
                    onClick={() => handleSearch("mathematics")}
                  >
                    Mathematics
                  </Badge>
                  <Badge 
                    variant="outline" 
                    className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
                    onClick={() => handleSearch("programming")}
                  >
                    Programming
                  </Badge>
                  <Badge 
                    variant="outline" 
                    className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
                    onClick={() => handleSearch("english")}
                  >
                    English
                  </Badge>
                  <Badge 
                    variant="outline" 
                    className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
                    onClick={() => handleSearch("physics")}
                  >
                    Physics
                  </Badge>
                  <Badge 
                    variant="outline" 
                    className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
                    onClick={() => handleSearch("chemistry")}
                  >
                    Chemistry
                  </Badge>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}
