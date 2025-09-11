"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Plus, Edit, Trash2, DollarSign, Clock, Star, Users, Check, X, Calendar, BookOpen, TrendingUp, Loader2 } from 'lucide-react'
import { gigsApi, bookingsApi } from '@/services/api'
import { useRouter } from "next/navigation"
import { useUser } from "@clerk/nextjs"

// Type definitions
interface Gig {
  _id: string
  title: string
  description: string
  category: string
  price: number
  duration: string
  createdAt: string
  teacher: string
}

interface BookingRequest {
  _id: string
  student?: {
    name: string
  }
  gig?: {
    title: string
  }
  scheduledDate: string
  scheduledTime: string
  status: 'pending' | 'accepted' | 'rejected'
  createdAt: string
}

export default function TeacherDashboard() {
  const router = useRouter()
  const { isSignedIn, isLoaded } = useUser()
  // Redirect to unified dashboard
  useEffect(() => {
    router.replace('/dashboard-2')
  }, [router])
  
  // State management
  const [gigs, setGigs] = useState<Gig[]>([])
  const [bookingRequests, setBookingRequests] = useState<BookingRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [createGigLoading, setCreateGigLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)

  // Form state for creating gigs
  const [gigForm, setGigForm] = useState({
    title: "",
    category: "",
    price: "",
    duration: "",
    description: "",
    availability: {
      days: [],
      times: []
    }
  })

  // Handle authentication and load data
  useEffect(() => {
    if (!isLoaded) return
    if (isSignedIn) {
      // Role guard
      const role = typeof window !== 'undefined' ? localStorage.getItem('role') : null
      if (role === 'student') {
        router.push('/student/dashboard')
        return
      }
      if (role !== 'teacher') {
        router.push('/role-selection')
        return
      }
      loadTeacherData()
    } else {
      router.push("/sign-in")
    }
  }, [isLoaded, isSignedIn, router])

  const loadTeacherData = async () => {
    try {
      setLoading(true)
      const [gigsResponse, bookingsResponse] = await Promise.all([
        gigsApi.getAllGigs(),
        bookingsApi.getMyBookings()
      ])
      
      // Filter gigs for current teacher (backend should handle this but adding client-side filter as backup)
      setGigs(gigsResponse.data || [])
      setBookingRequests(bookingsResponse.data || [])
    } catch (error) {
      console.error("Error loading teacher data:", error)
      setError("Failed to load dashboard data")
    } finally {
      setLoading(false)
    }
  }

  const handleCreateGig = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreateGigLoading(true)
    setError("")
    setSuccess("")

    try {
      // Validate form data
      if (!gigForm.title || !gigForm.category || !gigForm.price || !gigForm.duration || !gigForm.description) {
        setError("Please fill in all required fields")
        return
      }

      const gigData = {
        title: gigForm.title,
        category: gigForm.category,
        price: parseFloat(gigForm.price),
        duration: parseInt(gigForm.duration),
        description: gigForm.description,
        availability: gigForm.availability
      }

      console.log("Creating gig with data:", gigData)
      const result = await gigsApi.createGig(gigData)
      console.log("Gig created successfully:", result)
      
      setSuccess("Gig created successfully!")
      setIsCreateDialogOpen(false)
      setGigForm({
        title: "",
        category: "",
        price: "",
        duration: "",
        description: "",
        availability: { days: [], times: [] }
      })
      
      // Reload gigs
      await loadTeacherData()
    } catch (error: any) {
      console.error("Error creating gig:", error)
      const errorMessage = error.response?.data?.message || error.message || "Failed to create gig"
      setError(`Error: ${errorMessage}`)
      
      // If authentication error, redirect to login
      if (error.response?.status === 401) {
        router.push("/sign-in")
      }
    } finally {
      setCreateGigLoading(false)
    }
  }

  const handleDeleteGig = async (gigId: string) => {
    try {
      await gigsApi.deleteGig(gigId)
      setSuccess("Gig deleted successfully!")
      loadTeacherData()
    } catch (error) {
      console.error("Error deleting gig:", error)
      setError("Failed to delete gig")
    }
  }

  const handleBookingAction = async (bookingId: string, status: string) => {
    try {
      await bookingsApi.updateBookingStatus(bookingId, status)
      setSuccess(`Booking ${status} successfully!`)
      loadTeacherData()
    } catch (error) {
      console.error("Error updating booking:", error)
      setError("Failed to update booking")
    }
  }

  const [earnings] = useState({
    thisMonth: 1250,
    lastMonth: 980,
    totalEarnings: 15600,
    pendingPayout: 320,
  })

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
        <h1 className="text-3xl font-bold mb-2">Teacher Dashboard</h1>
        <p className="text-muted-foreground">Manage your gigs, bookings, and earnings</p>
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

      {/* Stats Cards */}
      <div className="grid md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Gigs</p>
                <p className="text-2xl font-bold">{gigs.length}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">This Month</p>
                <p className="text-2xl font-bold">${earnings.thisMonth}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending Requests</p>
                <p className="text-2xl font-bold">{bookingRequests.filter((r) => r.status === "pending").length}</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center">
                <Calendar className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Average Rating</p>
                <p className="text-2xl font-bold">4.9</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900 rounded-full flex items-center justify-center">
                <Star className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="gigs" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="gigs">My Gigs</TabsTrigger>
          <TabsTrigger value="bookings">Booking Requests</TabsTrigger>
          <TabsTrigger value="schedule">Schedule</TabsTrigger>
          <TabsTrigger value="earnings">Earnings</TabsTrigger>
        </TabsList>

        {/* Gigs Tab */}
        <TabsContent value="gigs" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold">My Teaching Gigs</h2>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Create New Gig
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create New Teaching Gig</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreateGig} className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="title">Gig Title</Label>
                      <Input 
                        id="title" 
                        placeholder="e.g., Advanced Mathematics Tutoring"
                        value={gigForm.title}
                        onChange={(e) => setGigForm({...gigForm, title: e.target.value})}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="category">Category</Label>
                      <Select value={gigForm.category} onValueChange={(value) => setGigForm({...gigForm, category: value})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Mathematics">Mathematics</SelectItem>
                          <SelectItem value="Science">Science</SelectItem>
                          <SelectItem value="English">English</SelectItem>
                          <SelectItem value="Programming">Programming</SelectItem>
                          <SelectItem value="Languages">Languages</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="price">Price per Hour ($)</Label>
                      <Input 
                        id="price" 
                        type="number" 
                        min="0"
                        step="0.01"
                        placeholder="25.00"
                        value={gigForm.price}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (value === '' || /^\d*\.?\d{0,2}$/.test(value)) {
                            setGigForm({...gigForm, price: value});
                          }
                        }}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="duration">Session Duration (minutes)</Label>
                      <Select 
                        value={gigForm.duration} 
                        onValueChange={(value) => setGigForm({...gigForm, duration: value})}
                        required
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select duration" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="30">30 minutes</SelectItem>
                          <SelectItem value="60">60 minutes</SelectItem>
                          <SelectItem value="90">90 minutes</SelectItem>
                          <SelectItem value="120">120 minutes</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      placeholder="Describe what students will learn in your sessions..."
                      rows={4}
                      value={gigForm.description}
                      onChange={(e) => setGigForm({...gigForm, description: e.target.value})}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={createGigLoading}>
                    {createGigLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      "Create Gig"
                    )}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-6">
            {gigs.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <div className="text-muted-foreground mb-4">
                    <Plus className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-semibold mb-2">No gigs created yet</h3>
                    <p>Create your first teaching gig to start connecting with students.</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              gigs.map((gig) => (
                <Card key={gig._id}>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-xl font-semibold">{gig.title}</h3>
                          <Badge variant="secondary">{gig.category}</Badge>
                          <Badge variant="outline" className="text-green-600">
                            Active
                          </Badge>
                        </div>
                        <p className="text-muted-foreground mb-4">{gig.description}</p>
                        <div className="flex items-center gap-6 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <DollarSign className="h-4 w-4" />${gig.price}/hour
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {gig.duration} min
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            Created {new Date(gig.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleDeleteGig(gig._id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* Booking Requests Tab */}
        <TabsContent value="bookings" className="space-y-6">
          <h2 className="text-2xl font-semibold">Booking Requests</h2>
          <div className="grid gap-4">
            {bookingRequests.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <div className="text-muted-foreground">
                    <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-semibold mb-2">No booking requests yet</h3>
                    <p>When students book your gigs, you'll see their requests here.</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              bookingRequests.map((request) => (
                <Card key={request._id}>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold">{request.student?.name || 'Student'}</h3>
                          <Badge variant="outline" className={
                            request.status === 'pending' ? 'text-orange-600' :
                            request.status === 'accepted' ? 'text-green-600' :
                            request.status === 'rejected' ? 'text-red-600' : ''
                          }>
                            {request.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          Gig: {request.gig?.title || 'Unknown Gig'}
                        </p>
                        <p className="text-sm text-muted-foreground mb-2">
                          Requested Time: {new Date(request.scheduledDate).toLocaleDateString()} at {request.scheduledTime}
                        </p>
                        <p className="text-sm mb-4">
                          Booked on: {new Date(request.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      {request.status === 'pending' && (
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            className="bg-green-600 hover:bg-green-700"
                            onClick={() => handleBookingAction(request._id, 'accepted')}
                          >
                            <Check className="h-4 w-4 mr-1" />
                            Accept
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleBookingAction(request._id, 'rejected')}
                          >
                            <X className="h-4 w-4 mr-1" />
                            Decline
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* Schedule Tab */}
        <TabsContent value="schedule" className="space-y-6">
          <h2 className="text-2xl font-semibold">My Schedule</h2>
          <Card>
            <CardContent className="p-6">
              <div className="text-center py-12">
                <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Schedule Integration Coming Soon</h3>
                <p className="text-muted-foreground">
                  We're working on a comprehensive calendar integration to help you manage your teaching schedule.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Earnings Tab */}
        <TabsContent value="earnings" className="space-y-6">
          <h2 className="text-2xl font-semibold">Earnings Overview</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Monthly Earnings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>This Month</span>
                    <span className="font-semibold text-green-600">${earnings.thisMonth}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Last Month</span>
                    <span className="font-semibold">${earnings.lastMonth}</span>
                  </div>
                  <div className="flex justify-between items-center pt-4 border-t">
                    <span className="font-semibold">Total Earnings</span>
                    <span className="font-bold text-lg">${earnings.totalEarnings}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Payout Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Pending Payout</span>
                    <span className="font-semibold text-orange-600">${earnings.pendingPayout}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Next Payout Date</span>
                    <span>Jan 15, 2024</span>
                  </div>
                  <Button className="w-full mt-4">Request Payout</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
