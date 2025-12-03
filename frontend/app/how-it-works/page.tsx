"use client"

import { BookOpen, Search, Calendar, Video, Star, UserCheck, GraduationCap } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

export default function HowItWorksPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-20 px-4">
            <div className="container mx-auto text-center">
                <div className="max-w-3xl mx-auto mb-12">
                    <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                        How TutorConnected Works
                    </h1>
                    <p className="text-xl text-muted-foreground mb-6">
                        TutorConnected makes it easy for students to find the perfect teacher and for teachers to share their knowledge with the world. Here's how it works:
                    </p>
                </div>
                <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                    {/* Step 1 */}
                    <Card className="text-center p-6 border-2 hover:border-primary/20 transition-colors">
                        <CardContent className="pt-6">
                            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
                                <UserCheck className="h-8 w-8 text-blue-600" />
                            </div>
                            <h3 className="text-xl font-semibold mb-2">1. Sign Up</h3>
                            <p className="text-muted-foreground">
                                Create a free account as a student or teacher in just a few clicks.
                            </p>
                        </CardContent>
                    </Card>
                    {/* Step 2 */}
                    <Card className="text-center p-6 border-2 hover:border-primary/20 transition-colors">
                        <CardContent className="pt-6">
                            <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Search className="h-8 w-8 text-green-600" />
                            </div>
                            <h3 className="text-xl font-semibold mb-2">2. Browse Gigs</h3>
                            <p className="text-muted-foreground">
                                Students can browse and search for classes or teachers that match their interests.
                            </p>
                        </CardContent>
                    </Card>
                    {/* Step 3 */}
                    <Card className="text-center p-6 border-2 hover:border-primary/20 transition-colors">
                        <CardContent className="pt-6">
                            <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Calendar className="h-8 w-8 text-purple-600" />
                            </div>
                            <h3 className="text-xl font-semibold mb-2">3. Book a Class</h3>
                            <p className="text-muted-foreground">
                                Choose a gig, select a time, and book your session instantly.
                            </p>
                        </CardContent>
                    </Card>
                    {/* Step 4 */}
                    <Card className="text-center p-6 border-2 hover:border-primary/20 transition-colors md:col-span-2">
                        <CardContent className="pt-6">
                            <div className="w-16 h-16 bg-yellow-100 dark:bg-yellow-900 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Video className="h-8 w-8 text-yellow-600" />
                            </div>
                            <h3 className="text-xl font-semibold mb-2">4. Attend & Learn</h3>
                            <p className="text-muted-foreground">
                                Join your class online and start learning or teaching with interactive tools.
                            </p>
                        </CardContent>
                    </Card>
                    {/* Step 5 */}
                    <Card className="text-center p-6 border-2 hover:border-primary/20 transition-colors md:col-span-1">
                        <CardContent className="pt-6">
                            <div className="w-16 h-16 bg-pink-100 dark:bg-pink-900 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Star className="h-8 w-8 text-pink-600" />
                            </div>
                            <h3 className="text-xl font-semibold mb-2">5. Review & Grow</h3>
                            <p className="text-muted-foreground">
                                Leave feedback and continue your learning journey!
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
} 