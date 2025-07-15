"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, DollarSign, Users, Calendar, Star, Edit, Trash2, Check, X, Clock } from "lucide-react"

export default function TeacherDashboard() {
  const router = useRouter()
  useEffect(() => {
    if (typeof window !== "undefined") {
      const role = localStorage.getItem("role")
      if (role !== "teacher") {
        router.replace("/login")
      }
    }
  }, [router])

  const [gigs, setGigs] = useState([
    {
      id: 1,
      title: "Advanced Mathematics Tutoring",
      subject: "Mathematics",
      price: 25,
      duration: 60,
      description: "Comprehensive math tutoring for high school and college students",
      rating: 4.9,
      totalStudents: 45,
      status: "active",
    },
    {
      id: 2,
      title: "Calculus Made Easy",
      subject: "Mathematics",
      price: 30,
      duration: 90,
      description: "Step-by-step calculus learning for beginners",
      rating: 4.8,
      totalStudents: 32,
      status: "active",
    },
  ])

  const [bookingRequests] = useState([
    {
      id: 1,
      studentName: "Alice Johnson",
      gigTitle: "Advanced Mathematics Tutoring",
      requestedTime: "2024-01-15 14:00",
      message: "I need help with differential equations",
      status: "pending",
    },
    {
      id: 2,
      studentName: "Bob Smith",
      gigTitle: "Calculus Made Easy",
      requestedTime: "2024-01-16 10:00",
      message: "Looking forward to learning calculus basics",
      status: "pending",
    },
  ])

  const [earnings] = useState({
    thisMonth: 1250,
    lastMonth: 980,
    totalEarnings: 15600,
    pendingPayout: 320,
  })

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Teacher Dashboard</h1>
        <p className="text-muted-foreground">Manage your gigs, bookings, and earnings</p>
      </div>

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
            <Dialog>
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
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="title">Gig Title</Label>
                      <Input id="title" placeholder="e.g., Advanced Mathematics Tutoring" />
                    </div>
                    <div>
                      <Label htmlFor="subject">Subject</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select subject" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="mathematics">Mathematics</SelectItem>
                          <SelectItem value="science">Science</SelectItem>
                          <SelectItem value="english">English</SelectItem>
                          <SelectItem value="programming">Programming</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="price">Price per Hour ($)</Label>
                      <Input id="price" type="number" placeholder="25" />
                    </div>
                    <div>
                      <Label htmlFor="duration">Session Duration (minutes)</Label>
                      <Select>
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
                    />
                  </div>
                  <Button className="w-full">Create Gig</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-6">
            {gigs.map((gig) => (
              <Card key={gig.id}>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-xl font-semibold">{gig.title}</h3>
                        <Badge variant="secondary">{gig.subject}</Badge>
                        <Badge variant="outline" className="text-green-600">
                          {gig.status}
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
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          {gig.rating}
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          {gig.totalStudents} students
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Booking Requests Tab */}
        <TabsContent value="bookings" className="space-y-6">
          <h2 className="text-2xl font-semibold">Booking Requests</h2>
          <div className="grid gap-4">
            {bookingRequests.map((request) => (
              <Card key={request.id}>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold">{request.studentName}</h3>
                        <Badge variant="outline">Pending</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">Gig: {request.gigTitle}</p>
                      <p className="text-sm text-muted-foreground mb-2">
                        Requested Time: {new Date(request.requestedTime).toLocaleString()}
                      </p>
                      <p className="text-sm mb-4">"{request.message}"</p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" className="bg-green-600 hover:bg-green-700">
                        <Check className="h-4 w-4 mr-1" />
                        Accept
                      </Button>
                      <Button size="sm" variant="outline">
                        <X className="h-4 w-4 mr-1" />
                        Decline
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
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
