"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { GigSearch } from "@/components/search/gig-search"
import Link from "next/link"
import { Calendar, Video, Star, ArrowRight, Search, UserCheck, GraduationCap, Sparkles, ShieldCheck, Award, Zap, Quote, DollarSign } from "lucide-react"
import { useEffect, useRef, useState } from "react"

export default function HomePage() {
  // Tutorial videos (replace URLs with your real demos later)
  const [activeVideo, setActiveVideo] = useState<"student" | "teacher" | "platform">("student")
  const videoSources: Record<typeof activeVideo, string> = {
    student: "https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    teacher: "https://storage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
    platform: "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
  }
  // Feature flags
  const showPromoSection = false

  // Stats animation
  const statsRef = useRef<HTMLDivElement | null>(null)
  const [statsInView, setStatsInView] = useState(false)

  useEffect(() => {
    if (!statsRef.current) return
    const el = statsRef.current
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setStatsInView(true)
          observer.disconnect()
        }
      },
      { threshold: 0.3 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  // How It Works animation trigger
  const howRef = useRef<HTMLDivElement | null>(null)
  const [howInView, setHowInView] = useState(false)
  useEffect(() => {
    if (!howRef.current) return
    const el = howRef.current
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setHowInView(true)
          observer.disconnect()
        }
      },
      { threshold: 0.4 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const CountUp = ({ end, duration = 1200, prefix = "", suffix = "" }: { end: number; duration?: number; prefix?: string; suffix?: string }) => {
    const [value, setValue] = useState(0)
    const startTimeRef = useRef<number | null>(null)

    useEffect(() => {
      if (!statsInView) return
      const start = 0
      const animate = (timestamp: number) => {
        if (!startTimeRef.current) startTimeRef.current = timestamp
        const progress = Math.min((timestamp - startTimeRef.current) / duration, 1)
        const eased = 1 - Math.pow(1 - progress, 3) // easeOutCubic
        const current = Math.floor(start + (end - start) * eased)
        setValue(current)
        if (progress < 1) requestAnimationFrame(animate)
      }
      const raf = requestAnimationFrame(animate)
      return () => cancelAnimationFrame(raf)
    }, [end, duration, statsInView])

    return <span>{`${prefix}${value.toLocaleString()}${suffix}`}</span>
  }
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-24 px-4 overflow-hidden bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        {/* Decorative background accents */}
        <div className="pointer-events-none absolute inset-0 [mask-image:radial-gradient(60%_60%_at_50%_10%,black,transparent)]">
          <div className="absolute -top-20 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-gradient-to-r from-blue-400/30 to-purple-400/30 blur-3xl"></div>
          <div className="absolute top-32 -left-10 h-56 w-56 rounded-full bg-blue-300/20 blur-2xl animate-pulse"></div>
          <div className="absolute bottom-10 -right-10 h-64 w-64 rounded-full bg-purple-300/20 blur-2xl animate-pulse"></div>
        </div>
        <div className="container mx-auto text-center relative">
          <div className="max-w-5xl mx-auto">
            <Badge variant="secondary" className="mb-4">
              🎓 Connect. Learn. Grow.
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Find Your Perfect Teacher, Anytime
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
              Join thousands of students and teachers on TutorConnected. Book personalized online classes, learn new skills,
              and achieve your educational goals.
            </p>
            {/* Search Feature - elevated card */}
            <div className="relative mb-10">
              <div className="relative mx-auto max-w-4xl rounded-2xl border border-white/50 dark:border-white/10 bg-white/70 dark:bg-gray-900/60 backdrop-blur-xl shadow-[0_20px_60px_-15px_rgba(30,64,175,0.35)]">
                <div className="absolute -inset-px rounded-2xl bg-gradient-to-r from-blue-600/10 via-transparent to-purple-600/10 pointer-events-none"></div>
                <div className="p-4 md:p-6">
                  <GigSearch />
                </div>
              </div>
            </div>
            
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

      {/* Why Choose Us */}
      <section className="py-20 px-4 relative overflow-hidden bg-muted/40 dark:bg-gray-900/40">
        <div className="pointer-events-none absolute inset-0 [mask-image:radial-gradient(70%_70%_at_50%_10%,black,transparent)]">
          <div className="absolute -top-16 left-1/2 -translate-x-1/2 h-72 w-72 rounded-full bg-gradient-to-r from-blue-400/20 to-purple-400/20 blur-3xl" />
        </div>
        <div className="container mx-auto relative">
          <div className="text-center mb-14">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm bg-primary/10 text-primary mb-3">
              <Sparkles className="h-4 w-4" /> Why Choose Us
            </span>
            <h2 className="text-3xl md:text-4xl font-bold mb-3">
              The better way to learn online
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              We combine expert mentors, seamless booking, and delightful UX to help you achieve more, faster.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {/* Card 1 */}
            <div className="group relative rounded-2xl border bg-background/60 backdrop-blur supports-[backdrop-filter]:bg-background/40 p-6 overflow-hidden hover:shadow-lg transition-shadow">
              <div className="absolute -top-10 -right-10 h-32 w-32 rounded-full bg-blue-500/10 blur-2xl transition-opacity group-hover:opacity-100 opacity-60" />
              <div className="flex items-center gap-3 mb-3">
                <div className="h-10 w-10 grid place-items-center rounded-xl bg-blue-600/10 text-blue-600">
                  <UserCheck className="h-5 w-5" />
                </div>
                <h3 className="text-xl font-semibold">Verified, Top-rated Teachers</h3>
              </div>
              <p className="text-muted-foreground mb-4">All mentors are vetted with transparent reviews so you can book with confidence.</p>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" /> 5,000+ 5‑star reviews
              </div>
            </div>

            {/* Card 2 */}
            <div className="group relative rounded-2xl border bg-background/60 backdrop-blur supports-[backdrop-filter]:bg-background/40 p-6 overflow-hidden hover:shadow-lg transition-shadow">
              <div className="absolute -top-10 -right-10 h-32 w-32 rounded-full bg-purple-500/10 blur-2xl transition-opacity group-hover:opacity-100 opacity-60" />
              <div className="flex items-center gap-3 mb-3">
                <div className="h-10 w-10 grid place-items-center rounded-xl bg-purple-600/10 text-purple-600">
                  <Calendar className="h-5 w-5" />
                </div>
                <h3 className="text-xl font-semibold">Instant Scheduling & Reminders</h3>
              </div>
              <p className="text-muted-foreground mb-4">Book in seconds with calendar invites and automatic reminders—never miss a session.</p>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Zap className="h-4 w-4" /> 1‑click booking, reschedule anytime
              </div>
            </div>

            {/* Card 3 */}
            <div className="group relative rounded-2xl border bg-background/60 backdrop-blur supports-[backdrop-filter]:bg-background/40 p-6 overflow-hidden hover:shadow-lg transition-shadow">
              <div className="absolute -top-10 -right-10 h-32 w-32 rounded-full bg-emerald-500/10 blur-2xl transition-opacity group-hover:opacity-100 opacity-60" />
              <div className="flex items-center gap-3 mb-3">
                <div className="h-10 w-10 grid place-items-center rounded-xl bg-emerald-600/10 text-emerald-600">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <h3 className="text-xl font-semibold">Secure Payments, Fair Pricing</h3>
              </div>
              <p className="text-muted-foreground mb-4">Protected payments with clear hourly rates—no hidden fees.</p>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <DollarSign className="h-4 w-4" /> From $15/hr across 50+ subjects
              </div>
            </div>
          </div>

          <div className="mt-10 flex items-center justify-center gap-4 text-sm text-muted-foreground">
            <div className="inline-flex items-center gap-2"><Award className="h-4 w-4" /> Trusted by 10k+ learners</div>
            <span className="hidden sm:inline opacity-60">•</span>
            <div className="inline-flex items-center gap-2"><GraduationCap className="h-4 w-4" /> Expert mentors worldwide</div>
          </div>
        </div>
      </section>

      {/* Stats Section (moved up) */}
      <section
        className="py-16 px-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-950 dark:to-gray-900"
        ref={statsRef}
      >
        <div className="container mx-auto">
          <div className="text-center mb-10">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs tracking-wider uppercase bg-primary/10 text-primary">
              <Zap className="h-3.5 w-3.5" /> By the numbers
            </span>
          </div>
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-primary mb-2">
                <CountUp end={10000} suffix="+" />
              </div>
              <div className="text-muted-foreground">Active Students</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary mb-2">
                <CountUp end={2500} suffix="+" />
              </div>
              <div className="text-muted-foreground">Expert Teachers</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary mb-2">
                <CountUp end={50} suffix="+" />
              </div>
              <div className="text-muted-foreground">Subjects Available</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary mb-2">
                <CountUp end={95} suffix="%" />
              </div>
              <div className="text-muted-foreground">Satisfaction Rate</div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 px-4 bg-muted/20 dark:bg-gray-900/20 border-t border-border">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm bg-primary/10 text-primary mb-3">
              <Zap className="h-4 w-4" /> How it works
            </span>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">How TutorConnected Works</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Simple steps to start your learning journey or begin teaching
            </p>
          </div>

          {/* Minimal responsive 3-step flow */}
          <div ref={howRef} className="max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row items-stretch md:items-center gap-10">
              {/* Step 1 */}
              <div className="flex-1">
                <div className={`rounded-2xl border bg-white/80 dark:bg-gray-900/60 shadow-sm p-6 hover:shadow-md transition-all duration-500 ${howInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`} style={{ transitionDelay: '0ms' }}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="h-12 w-12 grid place-items-center rounded-xl bg-blue-600/10 text-blue-700 dark:text-blue-400 transition-transform will-change-transform hover:scale-105">
                      <Search className="h-6 w-6" />
                    </div>
                    <div className="font-bold text-xl">Find Your Teacher</div>
                  </div>
                  <p className="text-sm text-muted-foreground">Browse verified teachers by subject & price.</p>
                </div>
              </div>

              {/* Connector 1 */}
              <div className="flex md:flex-col items-center justify-center gap-2 text-muted-foreground">
                {/* mobile/vertical */}
                <div className="md:hidden flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full bg-foreground/60 transition-opacity ${howInView ? 'opacity-100' : 'opacity-30'}`} style={{ transitionDuration: '400ms', transitionDelay: '0ms' }} />
                  <span className={`h-2 w-2 rounded-full bg-foreground/60 transition-opacity ${howInView ? 'opacity-100' : 'opacity-30'}`} style={{ transitionDuration: '400ms', transitionDelay: '120ms' }} />
                  <span className={`h-2 w-2 rounded-full bg-foreground/60 transition-opacity ${howInView ? 'opacity-100' : 'opacity-30'}`} style={{ transitionDuration: '400ms', transitionDelay: '240ms' }} />
                  <span className={`ml-1 text-xl font-semibold inline-block transform ${howInView ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-1'} transition-all`} style={{ transitionDuration: '400ms', transitionDelay: '360ms' }}>→</span>
                </div>
                {/* desktop/horizontal */}
                <div className="hidden md:flex md:flex-col items-center gap-2">
                  <span className={`h-2 w-2 rounded-full bg-foreground/60 transition-opacity ${howInView ? 'opacity-100' : 'opacity-30'}`} style={{ transitionDuration: '400ms', transitionDelay: '0ms' }} />
                  <span className={`h-2 w-2 rounded-full bg-foreground/60 transition-opacity ${howInView ? 'opacity-100' : 'opacity-30'}`} style={{ transitionDuration: '400ms', transitionDelay: '120ms' }} />
                  <span className={`h-2 w-2 rounded-full bg-foreground/60 transition-opacity ${howInView ? 'opacity-100' : 'opacity-30'}`} style={{ transitionDuration: '400ms', transitionDelay: '240ms' }} />
                  <span className={`text-xl font-semibold inline-block transform ${howInView ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-1'} transition-all`} style={{ transitionDuration: '400ms', transitionDelay: '360ms' }}>→</span>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex-1">
                <div className={`rounded-2xl border bg-white/80 dark:bg-gray-900/60 shadow-sm p-6 hover:shadow-md transition-all duration-500 ${howInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`} style={{ transitionDelay: '120ms' }}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="h-12 w-12 grid place-items-center rounded-xl bg-emerald-600/10 text-emerald-700 dark:text-emerald-400 transition-transform will-change-transform hover:scale-105">
                      <Calendar className="h-6 w-6" />
                    </div>
                    <div className="font-bold text-xl">Request a Class</div>
                  </div>
                  <p className="text-sm text-muted-foreground">Send a booking request with your preferred schedule.</p>
                  <div className="mt-3 inline-flex items-center gap-2 text-xs text-emerald-700 dark:text-emerald-400 bg-emerald-600/10 px-2.5 py-1 rounded-full">
                    <ShieldCheck className="h-3.5 w-3.5" /> Secure payments (SSL)
                  </div>
                  <div className="mt-4">
                    <Button size="sm" variant="secondary" className="inline-flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4" /> Pay Securely
                    </Button>
                  </div>
                </div>
              </div>

              {/* Connector 2 */}
              <div className="flex md:flex-col items-center justify-center gap-2 text-muted-foreground">
                {/* mobile/vertical */}
                <div className="md:hidden flex items-center gap-2">
                  <span className={`h-1.5 w-1.5 rounded-full bg-foreground/50 transition-opacity ${howInView ? 'opacity-100' : 'opacity-30'}`} style={{ transitionDuration: '400ms', transitionDelay: '0ms' }} />
                  <span className={`h-1.5 w-1.5 rounded-full bg-foreground/50 transition-opacity ${howInView ? 'opacity-100' : 'opacity-30'}`} style={{ transitionDuration: '400ms', transitionDelay: '120ms' }} />
                  <span className={`h-1.5 w-1.5 rounded-full bg-foreground/50 transition-opacity ${howInView ? 'opacity-100' : 'opacity-30'}`} style={{ transitionDuration: '400ms', transitionDelay: '240ms' }} />
                  <span className={`ml-1 text-lg inline-block transform ${howInView ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-1'} transition-all`} style={{ transitionDuration: '400ms', transitionDelay: '360ms' }}>→</span>
                </div>
                {/* desktop/horizontal */}
                <div className="hidden md:flex md:flex-col items-center gap-2">
                  <span className={`h-1.5 w-1.5 rounded-full bg-foreground/50 transition-opacity ${howInView ? 'opacity-100' : 'opacity-30'}`} style={{ transitionDuration: '400ms', transitionDelay: '0ms' }} />
                  <span className={`h-1.5 w-1.5 rounded-full bg-foreground/50 transition-opacity ${howInView ? 'opacity-100' : 'opacity-30'}`} style={{ transitionDuration: '400ms', transitionDelay: '120ms' }} />
                  <span className={`h-1.5 w-1.5 rounded-full bg-foreground/50 transition-opacity ${howInView ? 'opacity-100' : 'opacity-30'}`} style={{ transitionDuration: '400ms', transitionDelay: '240ms' }} />
                  <span className={`text-lg inline-block transform ${howInView ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-1'} transition-all`} style={{ transitionDuration: '400ms', transitionDelay: '360ms' }}>→</span>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex-1">
                <div className={`rounded-2xl border bg-white/80 dark:bg-gray-900/60 shadow-sm p-6 hover:shadow-md transition-all duration-500 ${howInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`} style={{ transitionDelay: '240ms' }}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="h-12 w-12 grid place-items-center rounded-xl bg-purple-600/10 text-purple-700 dark:text-purple-400 transition-transform will-change-transform hover:scale-105">
                      <GraduationCap className="h-6 w-6" />
                    </div>
                    <div className="font-bold text-xl">Learn & Review</div>
                  </div>
                  <p className="text-sm text-muted-foreground">Attend the class and leave feedback.</p>
                </div>
              </div>
            </div>
          </div>
          {/* Illustration under steps */}
          <div className="max-w-6xl mx-auto mt-12">
            <div className="rounded-2xl border bg-muted/30 overflow-hidden shadow-sm">
              <img
                src="https://ik.imagekit.io/28yikewmi/New%20Folder/Gradient%20Colorful%20Minimalist%20Coming%20%20Soon%20Banner.png?updatedAt=1754756321060v b/1200/600"
                alt="How TutorConnected works overview"
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* styles for sequential animation */}
          <style jsx>{`
            /* using transition + delay via inline styles above for staggered reveal */
          `}</style>

          
        </div>
      </section>

      


      {/* Promo / Ad Section (disabled) */}
      {showPromoSection && (
        <section className="relative py-24 px-4 overflow-hidden bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white">
          <div className="absolute inset-0 opacity-20 [mask-image:radial-gradient(70%_70%_at_50%_30%,black,transparent)]">
            <div className="absolute -top-10 left-1/2 -translate-x-1/2 h-72 w-72 rounded-full bg-white/20 blur-3xl"></div>
          </div>
          <div className="container mx-auto relative">
            <div className="grid lg:grid-cols-2 gap-10 items-center">
              {/* Left: headline + bullets */}
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-sm mb-4">
                  <Sparkles className="h-4 w-4" />
                  <span>Level up your learning</span>
                </div>
                <h2 className="text-3xl md:text-5xl font-bold leading-tight mb-4">
                  Learn faster. Teach smarter. With TutorConnected.
                </h2>
                <p className="text-white/90 text-lg mb-8 max-w-xl">
                  The all-in-one platform that matches students with expert teachers. Seamless booking, secure payments,
                  and crystal‑clear live classes—everything in one place.
                </p>

                <div className="grid sm:grid-cols-2 gap-4 mb-8">
                  <div className="flex items-start gap-3">
                    <ShieldCheck className="h-6 w-6 flex-shrink-0 text-white" />
                    <div>
                      <div className="font-semibold">Safe & Secure</div>
                      <div className="text-white/80 text-sm">Protected payments and verified teachers</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Zap className="h-6 w-6 flex-shrink-0 text-white" />
                    <div>
                      <div className="font-semibold">Instant Booking</div>
                      <div className="text-white/80 text-sm">Find a slot and start learning quickly</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Award className="h-6 w-6 flex-shrink-0 text-white" />
                    <div>
                      <div className="font-semibold">Top-rated Mentors</div>
                      <div className="text-white/80 text-sm">Thousands of 5‑star reviews</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Star className="h-6 w-6 flex-shrink-0 text-white" />
                    <div>
                      <div className="font-semibold">Proven Results</div>
                      <div className="text-white/80 text-sm">Boost grades and skills faster</div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <Button size="lg" variant="secondary" asChild>
                    <a href="#" aria-label="Get started now with TutorConnected">Get started free</a>
                  </Button>
                  <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-blue-700" asChild>
                    <a href="#" aria-label="See how it works">See how it works</a>
                  </Button>
                </div>
              </div>

              {/* Right: promo mockup */}
              <div className="relative">
                <div className="rounded-2xl overflow-hidden border border-white/20 bg-white/10 backdrop-blur-md shadow-2xl">
                  <img
                    src="/placeholder.svg?height=640&width=960"
                    alt="TutorConnected live class preview"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="absolute -bottom-4 -right-4 bg-white/90 text-blue-700 rounded-xl px-4 py-2 shadow-lg flex items-center gap-2">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="text-sm font-semibold">95% satisfaction</span>
                </div>
              </div>
            </div>

            {/* Logo strip */}
            <div className="mt-10 opacity-90">
              <div className="text-center text-white/80 text-sm mb-3">Trusted by learners worldwide</div>
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4 items-center">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-10 bg-white/15 rounded-md" />
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      

      {/* Testimonials Section */}
      <section className="relative py-24 px-4 bg-gradient-to-b from-muted/10 to-muted/40 dark:from-gray-950 dark:to-gray-900">
        {/* dotted grid overlays */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.05] dark:hidden"
          style={{ backgroundImage: "radial-gradient(rgba(0,0,0,0.8) 0.9px, transparent 0.9px)", backgroundSize: "18px 18px" }}
        />
        <div
          className="pointer-events-none absolute inset-0 hidden dark:block opacity-[0.06]"
          style={{ backgroundImage: "radial-gradient(rgba(255,255,255,0.7) 0.9px, transparent 0.9px)", backgroundSize: "18px 18px" }}
        />
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm bg-primary/10 text-primary mb-3">
              <Quote className="h-4 w-4" /> Testimonials
            </span>
            <h2 className="text-3xl md:text-4xl font-bold mb-3">Loved by learners and teachers</h2>
            <p className="text-muted-foreground text-lg">Real stories from people growing with TutorConnected</p>
          </div>

          {/* Marquee of short quotes - dual rows with masks */}
          <div className="relative overflow-hidden mb-12">
            {/* edge masks */}
            <div className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-white dark:from-gray-950 to-transparent" />
            <div className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-white dark:from-gray-950 to-transparent" />

            {/* Row 1 */}
            <div className="flex gap-4 animate-[scroll_18s_linear_infinite] will-change-transform transform-gpu whitespace-nowrap">
                {Array.from({ length: 2 }).flatMap((_, loopIndex) => (
                  [
                    { text: "Booked in minutes!", avatar: "/placeholder.svg?height=40&width=40" },
                    { text: "Best tutor experience", avatar: "/placeholder.svg?height=40&width=40" },
                    { text: "Crystal-clear calls", avatar: "/placeholder.svg?height=40&width=40" },
                    { text: "Flexible scheduling", avatar: "/placeholder.svg?height=40&width=40" },
                    { text: "Great value", avatar: "/placeholder.svg?height=40&width=40" },
                    { text: "Got an A in math!", avatar: "/placeholder.svg?height=40&width=40" },
                    { text: "Helped me ace IELTS", avatar: "/placeholder.svg?height=40&width=40" },
                  ].map((item, i) => (
                    <div
                      key={`r1-${loopIndex}-${i}`}
                      className="shrink-0 rounded-full border bg-white/80 dark:bg-gray-900/70 backdrop-blur px-4 py-2 text-sm text-muted-foreground shadow-sm hover:shadow-md transition-shadow inline-flex items-center gap-3"
                    >
                      <img src={item.avatar} alt="avatar" className="h-6 w-6 rounded-full object-cover" />
                      <span className="font-medium text-foreground/90">{item.text}</span>
                    </div>
                  ))
                ))}
              </div>

            {/* Row 2 (reverse) */}
            <div className="mt-4 flex gap-4 animate-[scroll-reverse_26s_linear_infinite] will-change-transform transform-gpu whitespace-nowrap">
                {Array.from({ length: 2 }).flatMap((_, loopIndex) => (
                  [
                    { text: "Super friendly mentors", avatar: "/placeholder.svg?height=40&width=40" },
                    { text: "Seamless payments", avatar: "/placeholder.svg?height=40&width=40" },
                    { text: "Schedules that fit", avatar: "/placeholder.svg?height=40&width=40" },
                    { text: "Loved the UX", avatar: "/placeholder.svg?height=40&width=40" },
                    { text: "Highly recommend", avatar: "/placeholder.svg?height=40&width=40" },
                    { text: "Ace your exams", avatar: "/placeholder.svg?height=40&width=40" },
                    { text: "Great support", avatar: "/placeholder.svg?height=40&width=40" },
                  ].map((item, i) => (
                    <div
                      key={`r2-${loopIndex}-${i}`}
                      className="shrink-0 rounded-full border bg-white/80 dark:bg-gray-900/70 backdrop-blur px-4 py-2 text-sm text-muted-foreground shadow-sm hover:shadow-md transition-shadow inline-flex items-center gap-3"
                    >
                      <img src={item.avatar} alt="avatar" className="h-6 w-6 rounded-full object-cover" />
                      <span className="font-medium text-foreground/90">{item.text}</span>
                    </div>
                  ))
                ))}
              </div>
          </div>

          {/* Cards */}
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                quote:
                  "TutorConnected matched me with an incredible calculus tutor. After 4 sessions, my grades jumped from B- to A!",
                name: "Nusrat Jahan",
                role: "Student, Dhaka University",
                avatar: "/placeholder.svg?height=80&width=80",
                rating: 5,
              },
              {
                quote:
                  "As a teacher, I love the instant bookings and reliable payments. My schedule is always full now.",
                name: "Arif Hossain",
                role: "Physics Teacher",
                avatar: "/placeholder.svg?height=80&width=80",
                rating: 5,
              },
              {
                quote:
                  "Smooth video classes and easy chat/file sharing. It just works—my students are more engaged than ever.",
                name: "Sarah Ahmed",
                role: "English Mentor",
                avatar: "/placeholder.svg?height=80&width=80",
                rating: 5,
              },
            ].map((t, idx) => (
              <div key={idx} className="relative h-full rounded-2xl border bg-gradient-to-b from-card to-card/90 shadow-md hover:shadow-lg transition-shadow will-change-transform hover:-translate-y-0.5">
                <div className="absolute -top-4 -left-4 h-10 w-10 rounded-full bg-primary/15 text-primary grid place-items-center shadow-sm">
                  <Quote className="h-5 w-5" />
                </div>
                <div className="p-6 flex flex-col h-full">
                  <p className="text-base md:text-lg leading-relaxed mb-6">{t.quote}</p>
                  <div className="mt-auto flex items-center gap-4">
                    <img src={t.avatar} alt={t.name} className="h-12 w-12 rounded-full object-cover ring-2 ring-primary/10" />
                    <div className="flex-1">
                      <div className="font-semibold">{t.name}</div>
                      <div className="text-sm text-muted-foreground">{t.role}</div>
                    </div>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: t.rating }).map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* keyframes for marquee */}
        <style jsx>{`
          @keyframes scroll {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }
          @keyframes scroll-reverse {
            0% { transform: translateX(-50%); }
            100% { transform: translateX(0); }
          }
        `}</style>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Start Your Learning Journey?</h2>
          <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
            Join TutorConnected today and connect with amazing teachers or start sharing your knowledge with students
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
                Teach on TutorConnected
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
