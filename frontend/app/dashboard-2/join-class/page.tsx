"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { api, bookingsApi, paymentsApi } from "@/services/api"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
    Video,
    Clock,
    Calendar,
    User,
    ExternalLink,
    Search,
    Play
} from "lucide-react"
import PaymentButton from "@/components/PaymentButton"
import { useUser } from "@clerk/nextjs"

interface Booking {
    _id: string
    gig?: {
        _id: string
        title: string
        description: string
        category: string
        duration: number
        price?: number
        teacher: {
            _id: string
            name: string
            email: string
            profileImage?: string
            avatar?: string
        }
    } | null
    student: {
        _id: string
        name: string
        email: string
    }
    scheduledDate: string
    scheduledAt?: string
    timeZone?: string
    status: "pending" | "accepted" | "completed" | "rejected"
    meetingLink?: string
    meetingRoomId?: string
    notes?: string
    createdAt: string
    attended?: boolean
    attendedAt?: string
}

export default function JoinClassPage() {
    const router = useRouter()
    const { isLoaded, isSignedIn, user } = useUser()
    const [bookings, setBookings] = useState<Booking[]>([])
    // We will render grouped sections instead of a single flat list
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")
    const { toast } = useToast()
    // Track payment status per booking for current student
    const [paidMap, setPaidMap] = useState<Record<string, boolean>>({})

    useEffect(() => {
        const syncAndFetch = async () => {
            try {
                if (!isLoaded) return
                if (!isSignedIn) return
                // Ensure backend token is present; if not, sync it
                let token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
                if (!token && user?.primaryEmailAddress?.emailAddress) {
                    try {
                        const email = user.primaryEmailAddress.emailAddress
                        const name = user.fullName || undefined
                        const res = await api.post('/auth/clerk-sync', { email, name })
                        const { token: t, user: backendUser } = res.data || {}
                        if (t) {
                            localStorage.setItem('token', t)
                        }
                        if (backendUser) {
                            localStorage.setItem('user', JSON.stringify(backendUser))
                        }
                    } catch (e) {
                        // ignore and let request fail gracefully
                    }
                }
                await fetchBookings()
            } finally {
                // loading state handled in fetchBookings
            }
        }
        syncAndFetch()
    }, [isLoaded, isSignedIn, user?.id])

    // No separate filtered state; we'll derive groupings in render from searchTerm

    // Lightweight timer to re-evaluate join availability without heavy re-renders
  const [nowTs, setNowTs] = useState<number>(() => Date.now())
  useEffect(() => {
        const id = setInterval(() => setNowTs(Date.now()), 30000) // 30s granularity for performance
        return () => clearInterval(id)
  }, [])

    const fetchBookings = async () => {
        try {
            const response = await bookingsApi.getMyBookings()
            setBookings(response.data)
            
            const accepted = (response.data || []).filter((b: Booking) => b.status === "accepted")
            const paidResults: Record<string, boolean> = {}
            const manualResults: Record<string, any> = {}
            
            // Batch fetch payment status (eliminates N+1)
            if (accepted.length > 0) {
                try {
                    const bookingIds = accepted.map((b: Booking) => b._id)
                    const batchRes = await paymentsApi.batchGetBookingStatus(bookingIds)
                    Object.assign(paidResults, batchRes?.data || {})
                } catch {
                    // Fallback: mark all as unpaid
                }
            }
            
            // Still need manual payment status checks individually (no batch endpoint yet)
            await Promise.all(accepted.map(async (bk: Booking) => {
                try {
                    const manualSt = await manualPaymentApi.getPaymentStatus(bk._id)
                    manualResults[bk._id] = manualSt?.data || null
                    
                    // Consider verified manual payment as paid
                    if (manualSt?.data?.paymentStatus === 'verified') {
                        paidResults[bk._id] = true
                    }
                } catch {
                    manualResults[bk._id] = null
                }
            }))
            
            setPaidMap(paidResults)
            setManualPaymentMap(manualResults)
        } catch (error) {
            console.error("Error fetching bookings:", error)
            toast({
                title: "Error",
                description: "Failed to load your classes. Please try again.",
                variant: "destructive"
            })
        } finally {
            setLoading(false)
        }
    }

    const getStart = (bk: Booking) => new Date(bk.scheduledAt || bk.scheduledDate).getTime()

    const handleJoinClass = (booking: Booking) => {
        const minutes = booking.gig?.duration || 90
        // Require successful payment before allowing to join (student side)
        const paid = paidMap[booking._id] === true
        if (!paid) {
            toast({
                title: "Payment Required",
                description: "Please complete the payment to join this class.",
                variant: "destructive"
            })
            return
        }
        if (booking.meetingRoomId) {
            router.push(`/dashboard/video-call/${booking.meetingRoomId}?minutes=${minutes}`)
            return
        }
        if (booking.meetingLink) {
            const roomId = booking.meetingLink.split('/').pop() || ''
            if (roomId) {
                router.push(`/dashboard/video-call/${roomId}?minutes=${minutes}`)
                return
            }
        }
        toast({
            title: "No Meeting Link",
            description: "The teacher hasn't provided a meeting link yet. Please contact them directly.",
            variant: "destructive"
        })
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case "accepted":
                return "bg-green-100 text-green-800"
            case "pending":
                return "bg-yellow-100 text-yellow-800"
            case "completed":
                return "bg-blue-100 text-blue-800"
            case "rejected":
                return "bg-red-100 text-red-800"
            default:
                return "bg-gray-100 text-gray-800"
        }
    }

    // Compute key timestamps for a booking with extended window
    const getTimes = (bk: Booking) => {
        const start = new Date(bk.scheduledAt || bk.scheduledDate).getTime()
        const durationMin = bk.gig?.duration || 90
        const windowOpen = start - 15 * 60 * 1000 // opens 15 minutes before class start
        const end = start + durationMin * 60 * 1000
        const windowClose = end + 60 * 60 * 1000 // closes 60 minutes after end
        return { start, windowOpen, end, windowClose, durationMin }
    }

    // Determine whether the join window is before/open/after
    const getWindowState = (bk: Booking) => {
        const { windowOpen, windowClose } = getTimes(bk)
        if (nowTs < windowOpen) return 'BEFORE' as const
        if (nowTs > windowClose) return 'AFTER' as const
        return 'OPEN' as const
    }

    const fmtCountdown = (ms: number) => {
        if (ms < 0) ms = 0
        const totalSec = Math.floor(ms / 1000)
        const m = Math.floor(totalSec / 60)
        const s = totalSec % 60
        return `${m}m ${s.toString().padStart(2, '0')}s`
    }

    const isJoinEnabled = (bk: Booking) => {
        const { windowOpen, windowClose } = getTimes(bk)
        const withinWindow = nowTs >= windowOpen && nowTs <= windowClose
        const paid = paidMap[bk._id] === true
        return withinWindow && paid
    }

    const formatDateTime = (bk: Booking) => {
        const date = new Date(bk.scheduledAt || bk.scheduledDate)
        return {
            date: date.toLocaleDateString(),
            time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading your classes...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Join Class</h1>
                    <p className="text-gray-600 mt-1">Access your scheduled classes and join live sessions</p>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Video className="h-4 w-4" />
                    <span>{bookings.filter(b => {
                        const q = searchTerm.toLowerCase();
                        if (!q) return true;
                        return (
                            (b.gig?.title || '').toLowerCase().includes(q) ||
                            (b.gig?.teacher?.name || '').toLowerCase().includes(q) ||
                            (b.gig?.category || '').toLowerCase().includes(q)
                        );
                    }).length} classes found</span>
                </div>
            </div>

            {/* Search */}
            <Card>
                <CardContent className="p-6">
                    <div className="relative max-w-xl">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <Input
                            placeholder="Search classes or teachers..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Grouped Classes List */}
            {(bookings.filter(b => {
                const q = searchTerm.toLowerCase();
                if (!q) return true;
                return (
                    (b.gig?.title || '').toLowerCase().includes(q) ||
                    (b.gig?.teacher?.name || '').toLowerCase().includes(q) ||
                    (b.gig?.category || '').toLowerCase().includes(q)
                );
            }).length === 0) ? (
                <Card>
                    <CardContent className="p-12 text-center">
                        <Video className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">No classes scheduled</h3>
                        <p className="text-gray-600 mb-4">You don't have any classes scheduled yet.</p>
                        <Link href="/dashboard/book-classes">
                            <Button>
                                <ExternalLink className="h-4 w-4 mr-2" />
                                Book a Class
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-8">
                    {(() => {
                        const q = searchTerm.toLowerCase();
                        const searchFilter = (bk: Booking) => !q ||
                          (bk.gig?.title || '').toLowerCase().includes(q) ||
                          (bk.gig?.teacher?.name || '').toLowerCase().includes(q) ||
                          (bk.gig?.category || '').toLowerCase().includes(q);
                        const pending = bookings.filter(b => b.status === 'pending' && searchFilter(b)).sort((a,b) => getStart(a) - getStart(b));

                        // Accepted prioritization: currently open first, then today's upcoming, then future by start time
                        const rawAccepted = bookings.filter(b => b.status === 'accepted' && searchFilter(b));
                        const today = new Date();
                        const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
                        const endOfToday = startOfToday + 24 * 60 * 60 * 1000 - 1;
                        const open = rawAccepted.filter(b => getWindowState(b) === 'OPEN').sort((a,b) => getStart(a) - getStart(b));
                        const todayUpcoming = rawAccepted.filter(b => getWindowState(b) === 'BEFORE' && (getStart(b) >= startOfToday && getStart(b) <= endOfToday)).sort((a,b) => getStart(a) - getStart(b));
                        const future = rawAccepted.filter(b => getWindowState(b) === 'BEFORE' && getStart(b) > endOfToday).sort((a,b) => getStart(a) - getStart(b));
                        const pastAccepted = rawAccepted.filter(b => getWindowState(b) === 'AFTER');
                        const accepted = [...open, ...todayUpcoming, ...future];

                        // Derive Completed vs Cancelled (missed) after the class window
                        const explicitlyCompleted = bookings.filter(b => b.status === 'completed' && searchFilter(b));
                        const completedFromAccepted = pastAccepted.filter(b => b.attended === true).map(b => ({ ...b, status: 'completed' as const }));
                        const completed = [...explicitlyCompleted, ...completedFromAccepted].sort((a,b) => getStart(b) - getStart(a));
                        const cancelled = pastAccepted.filter(b => b.attended !== true); // missed classes (window ended, not attended)
                        const rejected = bookings.filter(b => b.status === 'rejected' && searchFilter(b)).sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

                        const Section = ({ title, list }: { title: string; list: Booking[] }) => (
                          <div>
                            <div className="flex items-center justify-between mb-3">
                              <h3 className="text-lg font-semibold">{title}</h3>
                              <span className="text-sm text-gray-500">{list.length} item(s)</span>
                            </div>
                            {list.length === 0 ? (
                              <Card><CardContent className="p-6 text-sm text-gray-500">No items</CardContent></Card>
                            ) : (
                              <div className="space-y-4">
                                {list.map((booking, idx) => {
                                  const { date, time } = formatDateTime(booking);
                                  const canJoin = booking.status === 'accepted' && isJoinEnabled(booking);
                                  const isPaid = paidMap[booking._id] === true;
                                  const windowState = getWindowState(booking);
                                  const { windowOpen, end } = getTimes(booking);
                                  const opensIn = fmtCountdown(windowOpen - nowTs);
                                  const closesIn = fmtCountdown(end - nowTs);
                                  return (
                                    <Card key={booking._id} className={`${canJoin ? 'ring-2 ring-green-500 bg-green-50' : ''}`}>
                                      <CardContent className="p-6">
                                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                                          {/* Class Info */}
                                          <div className="flex-1 space-y-3">
                                            <div className="flex items-start justify-between">
                                              <div>
                                                <div className="text-xs text-gray-400">#{idx + 1}</div>
                                                <h4 className="text-lg font-semibold text-gray-900">{booking.gig?.title || 'Gig deleted'}</h4>
                                                {booking.gig?.category && (
                                                  <Badge variant="secondary" className="mt-1">{booking.gig?.category}</Badge>
                                                )}
                                              </div>
                                              <Badge className={title === 'Cancelled' ? 'bg-gray-100 text-gray-800' : getStatusColor(booking.status)}>
                                                {title === 'Cancelled' ? 'Cancelled' : (booking.status.charAt(0).toUpperCase() + booking.status.slice(1))}
                                              </Badge>
                                            </div>

                                            {/* Teacher Info */}
                                            <div className="flex items-center gap-3">
                                              <Avatar className="h-10 w-10">
                                                <AvatarImage src={booking.gig?.teacher?.avatar || booking.gig?.teacher?.profileImage} />
                                                <AvatarFallback>
                                                  {(booking.gig?.teacher?.name || 'T').split(' ').map(n => n[0]).join('')}
                                                </AvatarFallback>
                                              </Avatar>
                                              <div>
                                                <p className="font-medium">{booking.gig?.teacher?.name || 'Unknown Teacher'}</p>
                                                <p className="text-sm text-gray-500">{booking.gig?.teacher?.email || ''}</p>
                                              </div>
                                            </div>

                                            {/* Class Details */}
                                            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                                              <div className="flex items-center gap-1"><Calendar className="h-4 w-4" /><span>{date}</span></div>
                                              <div className="flex items-center gap-1"><Clock className="h-4 w-4" /><span>{time}</span></div>
                                              <div className="flex items-center gap-1"><Video className="h-4 w-4" /><span>{booking.gig?.duration || 90} minutes</span></div>
                                            </div>

                                            {/* Join window indicators */}
                                            {booking.status === 'accepted' && (
                                              <div>
                                                {windowState === 'BEFORE' && (
                                                  <div className="inline-block bg-yellow-50 text-yellow-800 text-xs px-2 py-1 rounded">
                                                    Join opens in {opensIn}
                                                  </div>
                                                )}
                                                {windowState === 'OPEN' && (
                                                  <div className="inline-block bg-green-50 text-green-800 text-xs px-2 py-1 rounded">
                                                    Join window open • closes in {closesIn}
                                                  </div>
                                                )}
                                                {windowState === 'AFTER' && (
                                                  <div className="inline-block bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded">
                                                    Class ended
                                                  </div>
                                                )}
                                              </div>
                                            )}

                                            {booking.notes && (
                                              <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg"><strong>Notes:</strong> {booking.notes}</p>
                                            )}
                                          </div>

                                          {/* Action Buttons */}
                                          {title !== 'Completed' && title !== 'Cancelled' && (
                                            <div className="flex flex-col gap-2 min-w-[200px]">
                                              {booking.status === 'accepted' && windowState === 'OPEN' && (
                                                <div className="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded-full text-center mb-2">Join window is open</div>
                                              )}

                                              {booking.status === 'accepted' && (
                                                <Button
                                                  onClick={() => handleJoinClass(booking)}
                                                  className={`w-full h-10 flex items-center gap-2 ${canJoin ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-200 text-gray-600'}`}
                                                  disabled={!canJoin || (!booking.meetingLink && !booking.meetingRoomId)}
                                                >
                                                  <Play className="h-4 w-4" />
                                                  {canJoin ? 'Join Now' : windowState === 'BEFORE' ? 'Join Class (locked)' : 'Join Class'}
                                                </Button>
                                              )}

                                              {booking.status === 'accepted' && !isPaid && booking.gig?._id && (
                                                <PaymentButton gigId={booking.gig._id} bookingId={booking._id} amount={((booking as any).gig?.price || 0)} className="w-full" buttonClassName="w-full h-10" />
                                              )}

                                            {booking.status === 'pending' && (
                                              <Button variant="outline" disabled><Clock className="h-4 w-4 mr-2" />Waiting for confirmation</Button>
                                            )}

                                            {booking.status === 'rejected' && (
                                              <Button variant="outline" disabled><Clock className="h-4 w-4 mr-2" />Rejected</Button>
                                            )}

                                            {booking.status === 'accepted' && windowState === 'AFTER' && booking.gig?._id && (
                                              <div className="flex flex-col gap-2">
                                                <div className="text-sm text-gray-700">You missed the class — book another session</div>
                                                <Link href={`/book/${booking.gig._id}`}>
                                                  <Button variant="secondary" className="w-full">Book Another Session</Button>
                                                </Link>
                                              </div>
                                            )}

                                            <Button variant="ghost" size="sm"><User className="h-4 w-4 mr-2" />Contact Teacher</Button>
                                          </div>
                                          )}
                                        </div>
                                      </CardContent>
                                    </Card>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );

                        return (
                          <>
                            <Section title="Accepted" list={accepted} />
                            <Section title="Pending" list={pending} />
                            <Section title="Completed" list={completed} />
                            <Section title="Cancelled" list={cancelled} />
                            <Section title="Rejected" list={rejected} />
                          </>
                        );
                    })()}
                </div>
            )}
        </div>
    )
}
