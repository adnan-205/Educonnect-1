"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useUser } from "@clerk/nextjs"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Search, Star, Clock, Calendar, Video, BookOpen, User, Loader2 } from "lucide-react"
import { gigsApi, bookingsApi } from "@/services/api"

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

interface Booking {
  _id: string
  gig: {
    _id: string
    title: string
    teacher: {
      name: string
    }
  }
  scheduledDate: string
  scheduledTime: string
  status: 'pending' | 'accepted' | 'rejected' | 'completed'
  createdAt: string
}

export default function StudentDashboard() {
  const router = useRouter()
  const { isSignedIn, isLoaded } = useUser()
  // Redirect to unified dashboard and avoid rendering heavy UI here
  useEffect(() => {
    router.replace('/dashboard')
  }, [router])
  return null
  
  // State management
  const [gigs, setGigs] = useState<Gig[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [bookingLoading, setBookingLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedSubject, setSelectedSubject] = useState("all")
  const [priceRange, setPriceRange] = useState("all")
  const [isBookingDialogOpen, setIsBookingDialogOpen] = useState(false)
  const [selectedGig, setSelectedGig] = useState<Gig | null>(null)
  
  // Booking form state
  const [bookingForm, setBookingForm] = useState({
    scheduledDate: "",
    scheduledTime: ""
  })

  // Authentication check
  useEffect(() => {
    if (!isLoaded) return
    if (!isSignedIn) {
      router.replace("/sign-in")
      return
    }
    // Role guard
    const role = typeof window !== 'undefined' ? localStorage.getItem('role') : null
    if (role === 'teacher') {
      router.replace('/teacher/dashboard')
      return
    }
    if (role !== 'student') {
      router.replace('/onboarding')
      return
    }
  }, [isLoaded, isSignedIn, router])

  // Load data when authenticated
  useEffect(() => {
    if (isLoaded && isSignedIn) {
      loadStudentData()
    }
  }, [isLoaded, isSignedIn])

  const loadStudentData = async () => {
    try {
      setLoading(true)
      setError("")
      const [gigsResponse, bookingsResponse] = await Promise.all([
        gigsApi.getAllGigs(),
        bookingsApi.getMyBookings()
      ])
      
      setGigs(gigsResponse.data || [])
      setBookings(bookingsResponse.data || [])
    } catch (error: any) {
      console.error("Error loading student data:", error)
      setError("Failed to load dashboard data")
    } finally {
      setLoading(false)
    }
  }

  const handleBookGig = (gig: Gig) => {
    setSelectedGig(gig)
    setIsBookingDialogOpen(true)
  }

  const handleSubmitBooking = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedGig) return

    setBookingLoading(true)
    setError("")
    setSuccess("")

    try {
      const bookingData = {
        gig: selectedGig._id,
        scheduledDate: bookingForm.scheduledDate,
        scheduledTime: bookingForm.scheduledTime
      }

      await bookingsApi.createBooking(bookingData)
      setSuccess("Booking request submitted successfully!")
      setIsBookingDialogOpen(false)
      setBookingForm({ scheduledDate: "", scheduledTime: "" })
      
      // Reload bookings
      loadStudentData()
    } catch (error: any) {
      console.error("Error creating booking:", error)
      setError(error.response?.data?.message || "Failed to create booking")
    } finally {
      setBookingLoading(false)
    }
  }

  const filteredGigs = gigs.filter((gig) => {
    const matchesSearch =
      gig.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      gig.teacher.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      gig.category.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesSubject = selectedSubject === "all" || gig.category.toLowerCase() === selectedSubject
    const matchesPrice =
      priceRange === "all" ||
      (priceRange === "under25" && gig.price < 25) ||
      (priceRange === "25-35" && gig.price >= 25 && gig.price <= 35) ||
      (priceRange === "over35" && gig.price > 35)

    return matchesSearch && matchesSubject && matchesPrice
  })

  // Separate bookings by status
  const upcomingBookings = bookings.filter(booking => 
    booking.status === 'accepted' || booking.status === 'pending'
  )
  const completedBookings = bookings.filter(booking => 
    booking.status === 'completed'
  )

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Student Dashboard</h1>
        <p className="text-muted-foreground">Discover amazing teachers and book your next learning session</p>
      </div>

      {/* Alert Messages */}
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {success && (
        <Alert className="mb-6">
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {/* Quick Stats */}
      <div className="grid md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Upcoming Classes</p>
                <p className="text-2xl font-bold">{upcomingBookings.length}</p>
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
                <p className="text-2xl font-bold">{completedBookings.length}</p>
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
            {filteredGigs.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <div className="text-muted-foreground">
                    <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-semibold mb-2">No gigs found</h3>
                    <p>Try adjusting your search filters to find more gigs.</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              filteredGigs.map((gig) => (
                <Card key={gig._id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex gap-6">
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary/10 to-purple-500/10 flex items-center justify-center">
                        <User className="h-8 w-8 text-primary/50" />
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h3 className="text-xl font-semibold mb-1">{gig.title}</h3>
                            <p className="text-muted-foreground">by {gig.teacher.name}</p>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-primary">${gig.price}</div>
                            <div className="text-sm text-muted-foreground">per hour</div>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 mb-3">
                          <Badge variant="secondary">{gig.category}</Badge>
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            <span className="font-medium">4.8</span>
                            <span className="text-muted-foreground">(12 reviews)</span>
                          </div>
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Clock className="h-4 w-4" />
                            {gig.duration} min
                          </div>
                        </div>

                        <p className="text-muted-foreground mb-4">{gig.description}</p>

                        <div className="flex justify-between items-center">
                          <div className="text-sm text-muted-foreground">
                            Created: {new Date(gig.createdAt).toLocaleDateString()}
                          </div>
                          <div className="flex gap-2">
                            <Button variant="outline">View Profile</Button>
                            <Button onClick={() => handleBookGig(gig)}>Book Now</Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {/* Booking Dialog */}
          <Dialog open={isBookingDialogOpen} onOpenChange={setIsBookingDialogOpen}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Book a Session</DialogTitle>
              </DialogHeader>
              {selectedGig && (
                <form onSubmit={handleSubmitBooking} className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">{selectedGig.title}</h4>
                    <p className="text-sm text-muted-foreground mb-4">
                      with {selectedGig.teacher.name} • ${selectedGig.price}/hour • {selectedGig.duration} min
                    </p>
                  </div>
                  
                  <div>
                    <Label htmlFor="scheduledDate">Preferred Date</Label>
                    <Input
                      id="scheduledDate"
                      type="date"
                      value={bookingForm.scheduledDate}
                      onChange={(e) => setBookingForm({...bookingForm, scheduledDate: e.target.value})}
                      min={new Date().toISOString().split('T')[0]}
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="scheduledTime">Preferred Time</Label>
                    <Input
                      id="scheduledTime"
                      type="time"
                      value={bookingForm.scheduledTime}
                      onChange={(e) => setBookingForm({...bookingForm, scheduledTime: e.target.value})}
                      required
                    />
                  </div>
                  
                  <Button type="submit" className="w-full" disabled={bookingLoading}>
                    {bookingLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Booking...
                      </>
                    ) : (
                      "Submit Booking Request"
                    )}
                  </Button>
                </form>
              )}
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* Upcoming Classes Tab */}
        <TabsContent value="upcoming" className="space-y-6">
          <h2 className="text-2xl font-semibold">Upcoming Classes</h2>
          <div className="grid gap-4">
            {upcomingBookings.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <div className="text-muted-foreground">
                    <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-semibold mb-2">No upcoming classes</h3>
                    <p>Book a gig to see your upcoming classes here.</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              upcomingBookings.map((booking) => (
                <Card key={booking._id}>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold mb-2">{booking.gig.title}</h3>
                        <p className="text-muted-foreground mb-2">with {booking.gig.teacher.name}</p>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {new Date(booking.scheduledDate).toLocaleDateString()}
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {booking.scheduledTime}
                          </div>
                          <Badge variant="outline" className={
                            booking.status === 'pending' ? 'text-orange-600' :
                            booking.status === 'accepted' ? 'text-green-600' :
                            'text-gray-600'
                          }>
                            {booking.status}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {booking.status === 'accepted' && (
                          <Button onClick={() => router.push(`/class/${booking._id}`)}>
                            <Video className="h-4 w-4 mr-2" />
                            Join Class
                          </Button>
                        )}
                        {booking.status === 'pending' && (
                          <Button variant="outline" disabled>
                            Waiting for approval
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* Class History Tab */}
        <TabsContent value="history" className="space-y-6">
          <h2 className="text-2xl font-semibold">Class History</h2>
          <div className="grid gap-4">
            {completedBookings.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <div className="text-muted-foreground">
                    <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-semibold mb-2">No completed classes yet</h3>
                    <p>Your completed classes will appear here after you finish them.</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              completedBookings.map((booking) => (
                <Card key={booking._id}>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold mb-2">{booking.gig.title}</h3>
                        <p className="text-muted-foreground mb-2">with {booking.gig.teacher.name}</p>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {new Date(booking.scheduledDate).toLocaleDateString()}
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {booking.scheduledTime}
                          </div>
                          <Badge variant="outline" className="text-green-600">
                            Completed
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Booked on: {new Date(booking.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" onClick={() => handleBookGig(gigs.find(g => g._id === booking.gig._id)!)}>
                          Book Again
                        </Button>
                        <Button variant="outline">Leave Review</Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
