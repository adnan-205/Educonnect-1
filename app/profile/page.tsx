"use client"

import { useState } from "react"
import { ProfileHeader } from "@/components/profile/profile-header"
import { ExperienceSection } from "@/components/profile/experience-section"
import { EducationSection } from "@/components/profile/education-section"
import { WorkSection } from "@/components/profile/work-section"
import { DemoVideoSection } from "@/components/profile/demo-video-section"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Star, MessageCircle, Calendar, Award } from "lucide-react"
import { UserProfile, Experience, Education, Work, DemoVideo } from "@/lib/types/profile"

export default function ProfilePage() {
  // Mock user profile data with LinkedIn-style structure
  const [profile, setProfile] = useState<UserProfile>({
    id: "1",
    name: "Sarah Johnson",
    email: "sarah.johnson@email.com",
    phone: "+1 (555) 123-4567",
    location: "New York, NY",
    bio: "Passionate mathematics educator with over 8 years of experience teaching calculus, algebra, and statistics. I believe in making complex concepts simple and accessible for all students.",
    headline: "Mathematics Teacher & Educational Consultant",
    userType: "teacher",
    avatar: "",
    coverImage: "",

    // Professional sections
    experiences: [
      {
        id: "1",
        title: "Senior Mathematics Teacher",
        company: "Lincoln High School",
        location: "New York, NY",
        startDate: "2020-08",
        endDate: undefined,
        current: true,
        description: "Lead mathematics instructor for advanced calculus and statistics courses. Developed innovative teaching methods that improved student performance by 25%. Mentor new teachers and coordinate department curriculum.",
        skills: ["Calculus", "Statistics", "Curriculum Development", "Mentoring"]
      },
      {
        id: "2",
        title: "Mathematics Tutor",
        company: "EduConnect Platform",
        location: "Remote",
        startDate: "2019-01",
        endDate: undefined,
        current: true,
        description: "Provide personalized online tutoring for high school and college students. Specialized in calculus, algebra, and test preparation. Maintained 4.9/5 rating with over 150 students taught.",
        skills: ["Online Teaching", "Test Prep", "Student Assessment"]
      }
    ],

    education: [
      {
        id: "1",
        degree: "Master of Science in Mathematics",
        institution: "Columbia University",
        location: "New York, NY",
        startDate: "2016-09",
        endDate: "2018-05",
        current: false,
        description: "Specialized in Applied Mathematics with focus on Statistical Analysis and Mathematical Modeling. Thesis: 'Advanced Statistical Methods in Educational Assessment'.",
        gpa: "3.8/4.0",
        activities: ["Math Club President", "Teaching Assistant", "Research Assistant"]
      },
      {
        id: "2",
        degree: "Bachelor of Science in Mathematics",
        institution: "New York University",
        location: "New York, NY",
        startDate: "2012-09",
        endDate: "2016-05",
        current: false,
        description: "Magna Cum Laude graduate with concentration in Pure Mathematics and Education. Active in student organizations and tutoring programs.",
        gpa: "3.7/4.0",
        activities: ["Phi Beta Kappa", "Math Tutoring Center", "Student Government"]
      }
    ],

    work: [
      {
        id: "1",
        position: "Educational Consultant",
        company: "MathWorks Education",
        location: "New York, NY",
        startDate: "2021-06",
        endDate: undefined,
        current: true,
        description: "Consult with schools and educational institutions on mathematics curriculum development and teacher training programs. Lead workshops and professional development sessions.",
        achievements: ["Trained over 200 teachers in advanced teaching methodologies", "Developed curriculum adopted by 15+ schools", "Increased student engagement scores by 30%"]
      }
    ],

    subjects: ["Mathematics", "Calculus", "Statistics", "Algebra", "Geometry"],
    languages: ["English", "Spanish"],
    skills: ["Teaching", "Curriculum Development", "Student Assessment", "Online Education", "Mentoring"],
    hourlyRate: 45,
    availability: "Monday-Friday, 9 AM - 6 PM",
    timezone: "EST (UTC-5)",
    demoVideos: [
      {
        id: "1",
        title: "Calculus Fundamentals: Derivatives",
        description: "A comprehensive introduction to derivatives in calculus, covering the basic concepts and practical examples.",
        videoUrl: "https://www.youtube.com/watch?v=example1",
        thumbnailUrl: "/placeholder.jpg",
        duration: "8:45",
        subject: "Calculus",
        uploadDate: "2024-01-15",
        videoType: "external"
      },
      {
        id: "2",
        title: "Algebra: Solving Quadratic Equations",
        description: "Step-by-step guide to solving quadratic equations using factoring, completing the square, and the quadratic formula.",
        videoUrl: "https://www.youtube.com/watch?v=example2",
        thumbnailUrl: "/placeholder.jpg",
        duration: "12:30",
        subject: "Algebra",
        uploadDate: "2024-01-10",
        videoType: "external"
      }
    ],

    // Stats
    rating: 4.9,
    totalStudents: 150,
    totalHours: 1200,
    reviews: 89,
    completionRate: 98,
    responseTime: "< 1 hour"
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

  const handleProfileUpdate = (updates: Partial<UserProfile>) => {
    setProfile(prev => ({ ...prev, ...updates }))
  }

  const handleExperienceUpdate = (experiences: Experience[]) => {
    setProfile(prev => ({ ...prev, experiences }))
  }

  const handleEducationUpdate = (education: Education[]) => {
    setProfile(prev => ({ ...prev, education }))
  }

  const handleWorkUpdate = (work: Work[]) => {
    setProfile(prev => ({ ...prev, work }))
  }

  const handleDemoVideoUpdate = (demoVideos: DemoVideo[]) => {
    setProfile(prev => ({ ...prev, demoVideos }))
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Profile Header */}
        <ProfileHeader
          profile={profile}
          onUpdate={handleProfileUpdate}
          isEditable={true}
        />

        {/* Professional Sections */}
        <div className="space-y-6">
          <ExperienceSection
            experiences={profile.experiences}
            onUpdate={handleExperienceUpdate}
            isEditable={true}
          />

          <WorkSection
            work={profile.work}
            onUpdate={handleWorkUpdate}
            isEditable={true}
          />

          <EducationSection
            education={profile.education}
            onUpdate={handleEducationUpdate}
            isEditable={true}
          />

          {/* Demo Videos Section - Only show for teachers */}
          {profile.userType === 'teacher' && (
            <DemoVideoSection
              videos={profile.demoVideos || []}
              onUpdate={handleDemoVideoUpdate}
              isEditable={true}
            />
          )}
        </div>

        {/* Reviews Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              Reviews & Feedback
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {reviews.map((review) => (
                <div key={review.id} className="border-b last:border-b-0 pb-6 last:pb-0">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-semibold">{review.student}</h4>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`h-4 w-4 ${i < review.rating
                                ? "fill-yellow-400 text-yellow-400"
                                : "text-gray-300"
                                }`}
                            />
                          ))}
                        </div>
                        <span>•</span>
                        <span>{new Date(review.date).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <Badge variant="outline">{review.subject}</Badge>
                  </div>
                  <p className="text-sm">{review.comment}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
