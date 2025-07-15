import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { Calendar, Video, Star, ArrowRight, Search, UserCheck, GraduationCap } from "lucide-react"

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-20 px-4 bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="container mx-auto text-center">
          <div className="max-w-4xl mx-auto">
            <Badge variant="secondary" className="mb-4">
              🎓 Connect. Learn. Grow.
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Find Your Perfect Teacher, Anytime
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Join thousands of students and teachers on EduConnect. Book personalized online classes, learn new skills,
              and achieve your educational goals.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild>
                <Link href="/browse">
                  Browse Classes <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/signup?type=teacher">Become a Teacher</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">How EduConnect Works</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Simple steps to start your learning journey or begin teaching
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Step 1 */}
            <Card className="text-center p-6 border-2 hover:border-primary/20 transition-colors">
              <CardContent className="pt-6">
                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2">1. Browse & Search</h3>
                <p className="text-muted-foreground">
                  Discover amazing teachers and subjects. Filter by price, rating, and availability.
                </p>
              </CardContent>
            </Card>

            {/* Step 2 */}
            <Card className="text-center p-6 border-2 hover:border-primary/20 transition-colors">
              <CardContent className="pt-6">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Calendar className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2">2. Book a Class</h3>
                <p className="text-muted-foreground">
                  Choose your preferred time slot and book instantly. Secure payment processing.
                </p>
              </CardContent>
            </Card>

            {/* Step 3 */}
            <Card className="text-center p-6 border-2 hover:border-primary/20 transition-colors">
              <CardContent className="pt-6">
                <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Video className="h-8 w-8 text-purple-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2">3. Join & Learn</h3>
                <p className="text-muted-foreground">
                  Attend your online class via integrated video call. Chat and share files easily.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Featured Teachers Section */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Featured Teachers</h2>
            <p className="text-xl text-muted-foreground">Learn from experienced educators across various subjects</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {[
              {
                name: "Sarah Johnson",
                subject: "Mathematics",
                rating: 4.9,
                price: "$25/hour",
                image: "/placeholder.svg?height=100&width=100",
                students: 150,
              },
              {
                name: "David Chen",
                subject: "Programming",
                rating: 4.8,
                price: "$35/hour",
                image: "/placeholder.svg?height=100&width=100",
                students: 89,
              },
              {
                name: "Maria Garcia",
                subject: "Spanish",
                rating: 5.0,
                price: "$20/hour",
                image: "/placeholder.svg?height=100&width=100",
                students: 200,
              },
            ].map((teacher, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4 mb-4">
                    <img
                      src={teacher.image || "/placeholder.svg"}
                      alt={teacher.name}
                      className="w-16 h-16 rounded-full object-cover"
                    />
                    <div>
                      <h3 className="font-semibold text-lg">{teacher.name}</h3>
                      <p className="text-muted-foreground">{teacher.subject}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-medium">{teacher.rating}</span>
                      <span className="text-muted-foreground">({teacher.students} students)</span>
                    </div>
                    <span className="font-semibold text-primary">{teacher.price}</span>
                  </div>
                  <Button className="w-full">View Profile</Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-primary mb-2">10,000+</div>
              <div className="text-muted-foreground">Active Students</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary mb-2">2,500+</div>
              <div className="text-muted-foreground">Expert Teachers</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary mb-2">50+</div>
              <div className="text-muted-foreground">Subjects Available</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary mb-2">95%</div>
              <div className="text-muted-foreground">Satisfaction Rate</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Start Your Learning Journey?</h2>
          <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
            Join EduConnect today and connect with amazing teachers or start sharing your knowledge with students
            worldwide.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" asChild>
              <Link href="/signup?type=student">
                <GraduationCap className="mr-2 h-4 w-4" />
                Join as Student
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="bg-transparent border-white text-white hover:bg-white hover:text-blue-600"
              asChild
            >
              <Link href="/signup?type=teacher">
                <UserCheck className="mr-2 h-4 w-4" />
                Teach on EduConnect
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
