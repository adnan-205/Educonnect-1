"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Star, Clock, Calendar, Video, BookOpen, User } from "lucide-react"

export default function StudentDashboard() {
  const router = useRouter()
  useEffect(() => {
    if (typeof window !== "undefined") {
      const role = localStorage.getItem("role")
      if (role !== "student") {
        router.replace("/login")
      }
    }
  }, [router])

  const [searchQuery, setSearchQuery] = useState("")
  const [selectedSubject, setSelectedSubject] = useState("all")
  const [priceRange, setPriceRange] = useState("all")

  const [availableGigs] = useState([
    {
      id: 1,
      title: "Advanced Mathematics Tutoring",
      teacher: "Sarah Johnson",
      subject: "Mathematics",
      price: 25,
      duration: 60,
      rating: 4.9,
      reviews: 45,
      description: "Comprehensive math tutoring for high school and college students",
      image: "/placeholder.svg?height=60&width=60",
      nextAvailable: "Today 2:00 PM",
    },
    {
      id: 2,
      title: "Python Programming for Beginners",
      teacher: "David Chen",
      subject: "Programming",
      price: 35,
      duration: 90,
      rating: 4.8,
      reviews: 32,
      description: "Learn Python from scratch with hands-on projects",
      image: "/placeholder.svg?height=60&width=60",
      nextAvailable: "Tomorrow 10:00 AM",
    },
    {
      id: 3,
      title: "Spanish Conversation Practice",
      teacher: "Maria Garcia",
      subject: "Languages",
      price: 20,
      duration: 45,
      rating: 5.0,
      reviews: 67,
      description: "Improve your Spanish speaking skills with native speaker",
      image: "/placeholder.svg?height=60&width=60",
      nextAvailable: "Today 4:00 PM",
    },
  ])

  const [upcomingClasses] = useState([
    {
      id: 1,
      title: "Calculus Review Session",
      teacher: "Sarah Johnson",
      date: "2024-01-15",
      time: "14:00",
      duration: 60,
      status: "confirmed",
    },
    {
      id: 2,
      title: "Python Basics - Variables",
      teacher: "David Chen",
      date: "2024-01-16",
      time: "10:00",
      duration: 90,
      status: "confirmed",
    },
  ])

  const [pastClasses] = useState([
    {
      id: 1,
      title: "Algebra Fundamentals",
      teacher: "Sarah Johnson",
      date: "2024-01-10",
      rating: 5,
      review: "Excellent explanation of complex concepts!",
    },
    {
      id: 2,
      title: "Spanish Grammar Basics",
      teacher: "Maria Garcia",
      date: "2024-01-08",
      rating: 5,
      review: "Very patient and helpful teacher.",
    },
  ])

  const filteredGigs = availableGigs.filter((gig) => {
    const matchesSearch =
      gig.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      gig.teacher.toLowerCase().includes(searchQuery.toLowerCase()) ||
      gig.subject.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesSubject = selectedSubject === "all" || gig.subject.toLowerCase() === selectedSubject
    const matchesPrice =
      priceRange === "all" ||
      (priceRange === "under25" && gig.price < 25) ||
      (priceRange === "25-35" && gig.price >= 25 && gig.price <= 35) ||
      (priceRange === "over35" && gig.price > 35)

    return matchesSearch && matchesSubject && matchesPrice
  })

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Student Dashboard</h1>
        <p className="text-muted-foreground">Discover amazing teachers and book your next learning session</p>
      </div>

      {/* Quick Stats */}
      <div className="grid md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Upcoming Classes</p>
                <p className="text-2xl font-bold">{upcomingClasses.length}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                <Calendar className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Completed Classes</p>
                <p className="text-2xl font-bold">{pastClasses.length}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                <BookOpen className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Favorite Teachers</p>
                <p className="text-2xl font-bold">3</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center">
                <User className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Hours Learned</p>
                <p className="text-2xl font-bold">24</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center">
                <Clock className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="browse" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="browse">Browse Gigs</TabsTrigger>
          <TabsTrigger value="upcoming">Upcoming Classes</TabsTrigger>
          <TabsTrigger value="history">Class History</TabsTrigger>
        </TabsList>

        {/* Browse Gigs Tab */}
        <TabsContent value="browse" className="space-y-6">
          {/* Search and Filters */}
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search for teachers, subjects, or topics..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="flex gap-4">
                  <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Subject" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Subjects</SelectItem>
                      <SelectItem value="mathematics">Mathematics</SelectItem>
                      <SelectItem value="programming">Programming</SelectItem>
                      <SelectItem value="languages">Languages</SelectItem>
                      <SelectItem value="science">Science</SelectItem>
                    </SelectContent>
                  </Select>
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
            {filteredGigs.map((gig) => (
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
                        <Badge variant="secondary">{gig.subject}</Badge>
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
            ))}
          </div>
        </TabsContent>

        {/* Upcoming Classes Tab */}
        <TabsContent value="upcoming" className="space-y-6">
          <h2 className="text-2xl font-semibold">Upcoming Classes</h2>
          <div className="grid gap-4">
            {upcomingClasses.map((class_) => (
              <Card key={class_.id}>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold mb-2">{class_.title}</h3>
                      <p className="text-muted-foreground mb-2">with {class_.teacher}</p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {new Date(class_.date).toLocaleDateString()}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {class_.time} ({class_.duration} min)
                        </div>
                        <Badge variant="outline" className="text-green-600">
                          {class_.status}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline">Reschedule</Button>
                      <Button onClick={() => router.push(`/class/${class_.id}`)}>
                        <Video className="h-4 w-4 mr-2" />
                        Join Class
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Class History Tab */}
        <TabsContent value="history" className="space-y-6">
          <h2 className="text-2xl font-semibold">Class History</h2>
          <div className="grid gap-4">
            {pastClasses.map((class_) => (
              <Card key={class_.id}>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold mb-2">{class_.title}</h3>
                      <p className="text-muted-foreground mb-2">with {class_.teacher}</p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {new Date(class_.date).toLocaleDateString()}
                        </div>
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          {class_.rating}/5
                        </div>
                      </div>
                      <p className="text-sm italic">"{class_.review}"</p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline">Book Again</Button>
                      <Button variant="outline">Leave Review</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
