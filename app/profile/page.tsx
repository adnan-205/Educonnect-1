"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Star, MapPin, BookOpen, Award, Edit, Camera, Globe, Mail, Phone } from "lucide-react"

export default function ProfilePage() {
  const [isEditing, setIsEditing] = useState(false)
  const [userType] = useState<"student" | "teacher">("teacher") // Mock user type

  const [profile, setProfile] = useState({
    name: "Sarah Johnson",
    email: "sarah.johnson@email.com",
    phone: "+1 (555) 123-4567",
    location: "New York, NY",
    bio: "Passionate mathematics educator with over 8 years of experience teaching calculus, algebra, and statistics. I believe in making complex concepts simple and accessible for all students.",
    subjects: ["Mathematics", "Calculus", "Statistics", "Algebra"],
    languages: ["English", "Spanish"],
    education: "M.S. in Mathematics, Columbia University",
    experience: "8 years",
    hourlyRate: 25,
    availability: "Monday-Friday, 9 AM - 6 PM",
    timezone: "EST (UTC-5)",
  })

  const [stats] = useState({
    totalStudents: 150,
    totalHours: 1200,
    rating: 4.9,
    reviews: 89,
    completionRate: 98,
    responseTime: "< 1 hour",
  })

  const [reviews] = useState([
    {
      id: 1,
      student: "Alex Chen",
      rating: 5,
      comment:
        "Sarah is an amazing teacher! She explains complex calculus concepts in a way that's easy to understand.",
      date: "2024-01-10",
      subject: "Calculus",
    },
    {
      id: 2,
      student: "Maria Rodriguez",
      rating: 5,
      comment: "Very patient and knowledgeable. Helped me improve my algebra skills significantly.",
      date: "2024-01-08",
      subject: "Algebra",
    },
    {
      id: 3,
      student: "David Kim",
      rating: 4,
      comment: "Great statistics tutor. Made the subject much more interesting and understandable.",
      date: "2024-01-05",
      subject: "Statistics",
    },
  ])

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Profile Header */}
        <Card className="mb-8">
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row gap-6">
              {/* Avatar Section */}
              <div className="flex flex-col items-center">
                <div className="relative">
                  <Avatar className="w-32 h-32">
                    <AvatarImage src="/placeholder.svg?height=128&width=128" />
                    <AvatarFallback className="text-2xl">SJ</AvatarFallback>
                  </Avatar>
                  <Button size="sm" variant="secondary" className="absolute bottom-0 right-0 rounded-full w-8 h-8 p-0">
                    <Camera className="h-4 w-4" />
                  </Button>
                </div>
                <Badge variant="secondary" className="mt-4">
                  {userType === "teacher" ? "Teacher" : "Student"}
                </Badge>
              </div>

              {/* Profile Info */}
              <div className="flex-1">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h1 className="text-3xl font-bold mb-2">{profile.name}</h1>
                    <div className="flex items-center gap-4 text-muted-foreground mb-4">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {profile.location}
                      </div>
                      <div className="flex items-center gap-1">
                        <Globe className="h-4 w-4" />
                        {profile.timezone}
                      </div>
                    </div>
                  </div>
                  <Button variant="outline" onClick={() => setIsEditing(!isEditing)}>
                    <Edit className="h-4 w-4 mr-2" />
                    {isEditing ? "Cancel" : "Edit Profile"}
                  </Button>
                </div>

                <p className="text-muted-foreground mb-6">{profile.bio}</p>

                {/* Subjects */}
                <div className="mb-4">
                  <h3 className="font-semibold mb-2">Subjects</h3>
                  <div className="flex flex-wrap gap-2">
                    {profile.subjects.map((subject, index) => (
                      <Badge key={index} variant="secondary">
                        {subject}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Languages */}
                <div className="mb-6">
                  <h3 className="font-semibold mb-2">Languages</h3>
                  <div className="flex flex-wrap gap-2">
                    {profile.languages.map((language, index) => (
                      <Badge key={index} variant="outline">
                        {language}
                      </Badge>
                    ))}
                  </div>
                </div>

                {userType === "teacher" && (
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                      <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                      <span className="font-semibold">{stats.rating}</span>
                      <span className="text-muted-foreground">({stats.reviews} reviews)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-5 w-5 text-blue-600" />
                      <span>{stats.totalStudents} students taught</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="reviews">Reviews</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
            <TabsTrigger value="achievements">Achievements</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Contact Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Contact Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {isEditing ? (
                    <>
                      <div>
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" value={profile.email} />
                      </div>
                      <div>
                        <Label htmlFor="phone">Phone</Label>
                        <Input id="phone" value={profile.phone} />
                      </div>
                      <div>
                        <Label htmlFor="location">Location</Label>
                        <Input id="location" value={profile.location} />
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span>{profile.email}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span>{profile.phone}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span>{profile.location}</span>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Professional Information */}
              {userType === "teacher" && (
                <Card>
                  <CardHeader>
                    <CardTitle>Professional Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {isEditing ? (
                      <>
                        <div>
                          <Label htmlFor="education">Education</Label>
                          <Input id="education" value={profile.education} />
                        </div>
                        <div>
                          <Label htmlFor="experience">Experience</Label>
                          <Input id="experience" value={profile.experience} />
                        </div>
                        <div>
                          <Label htmlFor="hourlyRate">Hourly Rate ($)</Label>
                          <Input id="hourlyRate" type="number" value={profile.hourlyRate} />
                        </div>
                      </>
                    ) : (
                      <>
                        <div>
                          <span className="font-medium">Education:</span>
                          <p className="text-muted-foreground">{profile.education}</p>
                        </div>
                        <div>
                          <span className="font-medium">Experience:</span>
                          <p className="text-muted-foreground">{profile.experience}</p>
                        </div>
                        <div>
                          <span className="font-medium">Hourly Rate:</span>
                          <p className="text-muted-foreground">${profile.hourlyRate}/hour</p>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Bio Section */}
            <Card>
              <CardHeader>
                <CardTitle>About Me</CardTitle>
              </CardHeader>
              <CardContent>
                {isEditing ? (
                  <Textarea
                    value={profile.bio}
                    onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                    rows={4}
                    placeholder="Tell students about yourself, your teaching style, and experience..."
                  />
                ) : (
                  <p className="text-muted-foreground">{profile.bio}</p>
                )}
              </CardContent>
            </Card>

            {/* Statistics */}
            {userType === "teacher" && (
              <Card>
                <CardHeader>
                  <CardTitle>Teaching Statistics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-3 gap-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">{stats.totalStudents}</div>
                      <div className="text-sm text-muted-foreground">Students Taught</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">{stats.totalHours}</div>
                      <div className="text-sm text-muted-foreground">Hours Taught</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">{stats.completionRate}%</div>
                      <div className="text-sm text-muted-foreground">Completion Rate</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {isEditing && (
              <div className="flex gap-4">
                <Button onClick={() => setIsEditing(false)}>Save Changes</Button>
                <Button variant="outline" onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
              </div>
            )}
          </TabsContent>

          {/* Reviews Tab */}
          <TabsContent value="reviews" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Student Reviews</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {reviews.map((review) => (
                  <div key={review.id} className="border-b pb-6 last:border-b-0">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-semibold">{review.student}</h4>
                        <div className="flex items-center gap-2">
                          <div className="flex">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`h-4 w-4 ${
                                  i < review.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                                }`}
                              />
                            ))}
                          </div>
                          <Badge variant="outline">{review.subject}</Badge>
                        </div>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {new Date(review.date).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-muted-foreground">{review.comment}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Account Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="timezone">Timezone</Label>
                  <Select defaultValue="est">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="est">EST (UTC-5)</SelectItem>
                      <SelectItem value="pst">PST (UTC-8)</SelectItem>
                      <SelectItem value="cst">CST (UTC-6)</SelectItem>
                      <SelectItem value="mst">MST (UTC-7)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="availability">Availability</Label>
                  <Textarea
                    id="availability"
                    value={profile.availability}
                    onChange={(e) => setProfile({ ...profile, availability: e.target.value })}
                    rows={3}
                  />
                </div>
                <Button>Save Settings</Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Achievements Tab */}
          <TabsContent value="achievements" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Achievements & Badges</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
                    <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900 rounded-full flex items-center justify-center">
                      <Award className="h-6 w-6 text-yellow-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold">Top Rated Teacher</h4>
                      <p className="text-sm text-muted-foreground">Maintained 4.8+ rating for 6 months</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                      <BookOpen className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold">100+ Students</h4>
                      <p className="text-sm text-muted-foreground">Successfully taught over 100 students</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
