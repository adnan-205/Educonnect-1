"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { api, bookingsApi, paymentsApi, manualPaymentApi } from "@/services/api"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { Calendar, Clock, User, CheckCircle, XCircle, Video, CreditCard, Eye, X } from "lucide-react"
import { useUser } from "@clerk/nextjs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"

export default function BookingsPage() {
    const router = useRouter()
    const { isLoaded, isSignedIn, user } = useUser()
    const [bookings, setBookings] = useState<any[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")
    const { toast } = useToast()
    const [paidMap, setPaidMap] = useState<Record<string, boolean>>({})
    
    // Manual payment verification state
    const [manualPaymentMap, setManualPaymentMap] = useState<Record<string, any>>({})
    const [verifyingBooking, setVerifyingBooking] = useState<any>(null)
    const [rejectDialogOpen, setRejectDialogOpen] = useState(false)
    const [rejectReason, setRejectReason] = useState("")
    const [actionLoading, setActionLoading] = useState(false)

    useEffect(() => {
        const syncAndFetch = async () => {
            try {
                if (!isLoaded) return
                if (!isSignedIn) return
                let token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
                if (!token && user?.primaryEmailAddress?.emailAddress) {
                    try {
                        const email = user.primaryEmailAddress.emailAddress
                        const name = user.fullName || undefined
                        const res = await api.post('/auth/clerk-sync', { email, name })
                        const { token: t, user: backendUser } = res.data || {}
                        if (t) localStorage.setItem('token', t)
                        if (backendUser) localStorage.setItem('user', JSON.stringify(backendUser))
                    } catch {}
                }
                await loadBookings()
            } finally {}
        }
        syncAndFetch()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isLoaded, isSignedIn, user?.id])

    const loadBookings = async () => {
        try {
            setLoading(true)
            setError("")
            const res = await bookingsApi.getMyBookings()
            const list = res?.data || []
            setBookings(list)
            // Prefetch paid status and manual payment status for accepted bookings
            const accepted = list.filter((b: any) => b.status === "accepted")
            const results: Record<string, boolean> = {}
            const manualResults: Record<string, any> = {}
            await Promise.all(accepted.map(async (b: any) => {
                try {
                    // Check manual payment status first
                    const manualSt = await manualPaymentApi.getPaymentStatus(b._id)
                    manualResults[b._id] = manualSt?.data || null
                    // Consider verified manual payment as paid
                    if (manualSt?.data?.paymentStatus === 'verified') {
                        results[b._id] = true
                    } else {
                        // Fallback to SSLCommerz check
                        const st = await paymentsApi.getBookingStatus(b._id)
                        results[b._id] = !!st?.paid
                    }
                } catch {
                    results[b._id] = false
                    manualResults[b._id] = null
                }
            }))
            setPaidMap(results)
            setManualPaymentMap(manualResults)
        } catch (e: any) {
            setError(e?.response?.data?.message || "Failed to load bookings")
        } finally {
            setLoading(false)
        }
    }

    const handleAccept = async (bookingId: string) => {
        try {
            await bookingsApi.updateBookingStatus(bookingId, "accepted")
            toast({
                title: "Success",
                description: "Booking accepted successfully"
            })
            loadBookings()
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to accept booking",
                variant: "destructive"
            })
        }
    }

    const handleReject = async (bookingId: string) => {
        try {
            await bookingsApi.updateBookingStatus(bookingId, "rejected")
            toast({
                title: "Success",
                description: "Booking rejected"
            })
            loadBookings()
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to reject booking",
                variant: "destructive"
            })
        }
    }

    // Manual payment verification handlers
    const handleVerifyPayment = async (bookingId: string) => {
        try {
            setActionLoading(true)
            await manualPaymentApi.verifyPayment(bookingId)
            toast({
                title: "Payment Verified",
                description: "Student can now join the class"
            })
            setVerifyingBooking(null)
            loadBookings()
        } catch (error: any) {
            toast({
                title: "Error",
                description: error?.response?.data?.message || "Failed to verify payment",
                variant: "destructive"
            })
        } finally {
            setActionLoading(false)
        }
    }

    const handleRejectPayment = async () => {
        if (!verifyingBooking || !rejectReason.trim()) {
            toast({
                title: "Error",
                description: "Please provide a rejection reason",
                variant: "destructive"
            })
            return
        }
        try {
            setActionLoading(true)
            await manualPaymentApi.rejectPayment(verifyingBooking._id, rejectReason.trim())
            toast({
                title: "Payment Rejected",
                description: "Student has been notified"
            })
            setRejectDialogOpen(false)
            setVerifyingBooking(null)
            setRejectReason("")
            loadBookings()
        } catch (error: any) {
            toast({
                title: "Error",
                description: error?.response?.data?.message || "Failed to reject payment",
                variant: "destructive"
            })
        } finally {
            setActionLoading(false)
        }
    }

    const getManualPaymentStatusBadge = (status: string) => {
        switch (status) {
            case 'pending_manual':
                return <Badge className="bg-yellow-100 text-yellow-800">Awaiting Payment</Badge>
            case 'submitted':
                return <Badge className="bg-blue-100 text-blue-800">Needs Verification</Badge>
            case 'verified':
                return <Badge className="bg-green-100 text-green-800">Verified</Badge>
            case 'rejected':
                return <Badge className="bg-red-100 text-red-800">Rejected</Badge>
            case 'expired':
                return <Badge className="bg-gray-100 text-gray-800">Expired</Badge>
            default:
                return null
        }
    }

    // Route to embedded meeting page for accepted bookings
    const handleJoinAccepted = (booking: any) => {
        const minutes = booking?.gig?.duration || 90
        if (booking?.meetingRoomId) {
            router.push(`/dashboard/video-call/${booking.meetingRoomId}?minutes=${minutes}`)
            return
        }
        if (booking?.meetingLink) {
            const roomId = (booking.meetingLink as string).split('/').pop() || ''
            if (roomId) {
                router.push(`/dashboard/video-call/${roomId}?minutes=${minutes}`)
                return
            }
        }
        toast({
            title: "No Meeting Link",
            description: "Meeting link not available yet.",
            variant: "destructive"
        })
    }

    // Smart poll: auto-refresh when there are bookings awaiting payment updates (teacher sees changes without refresh)
    useEffect(() => {
        if (loading) return
        // Check if any accepted bookings have pending/submitted manual payment status
        const needsPoll = bookings.some((b: any) => {
            if (b.status !== 'accepted') return false
            const mp = manualPaymentMap[b._id]
            const ps = mp?.paymentStatus
            return ps === 'pending_manual' || ps === 'submitted'
        })
        if (!needsPoll) return

        let isMounted = true
        const interval = setInterval(async () => {
            // Skip polling when tab is hidden
            if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return
            try {
                if (isMounted) await loadBookings()
            } catch {
                // ignore polling errors
            }
        }, 20000) // Poll every 20 seconds

        return () => {
            isMounted = false
            clearInterval(interval)
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [bookings.length, Object.keys(manualPaymentMap).length, loading])

    const getStatusColor = (status: string) => {
        switch (status) {
            case "accepted":
                return "bg-green-100 text-green-800"
            case "rejected":
                return "bg-red-100 text-red-800"
            case "completed":
                return "bg-blue-100 text-blue-800"
            default:
                return "bg-yellow-100 text-yellow-800"
        }
    }

    // Lightweight timer and helpers for timezone-accurate join gating
    const [nowTs, setNowTs] = useState<number>(() => Date.now())
    useEffect(() => {
        const id = setInterval(() => setNowTs(Date.now()), 30000) // 30s
        return () => clearInterval(id)
    }, [])

    const startTime = (bk: any) => new Date(bk?.scheduledAt || bk?.scheduledDate).getTime()
    const isJoinEnabled = (bk: any) => {
        const start = startTime(bk)
        const durationMin = bk?.gig?.duration || 90
        const windowOpen = start - 15 * 60 * 1000
        const endTs = start + durationMin * 60 * 1000
        const windowClose = endTs + 60 * 60 * 1000
        return nowTs >= windowOpen && nowTs <= windowClose
    }
    const formatDateTime = (bk: any) => {
        const d = new Date(bk?.scheduledAt || bk?.scheduledDate)
        return {
            date: d.toLocaleDateString(),
            time: d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
    }

    // Split bookings into sections
    const requestBookings = bookings.filter((b) => b.status === "pending")
    const acceptedBookings = bookings.filter((b) => b.status === "accepted")
    const rejectedBookings = bookings.filter((b) => b.status === "rejected")

    // Reusable booking item card to reduce duplication
    const BookingItem = ({ booking, right }: { booking: any; right?: any }) => (
        <Card className="bg-white shadow-sm border-0">
            <CardContent className="p-6">
                <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4">
                        <Avatar className="h-12 w-12">
                            <AvatarImage src={booking.student?.avatar || "/placeholder.jpg"} />
                            <AvatarFallback>
                                {booking.student?.name?.split(' ').map((n: string) => n[0]).join('') || 'ST'}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                            <h3 className="font-semibold text-gray-900 mb-1">{booking.gig?.title}</h3>
                            <p className="text-sm text-gray-600 mb-2">Student: {booking.student?.name}</p>
                            <div className="flex items-center gap-4 text-sm text-gray-500">
                                <div className="flex items-center gap-1">
                                    <Calendar className="h-4 w-4" />
                                    {formatDateTime(booking).date}
                                </div>
                                <div className="flex items-center gap-1">
                                    <Clock className="h-4 w-4" />
                                    {formatDateTime(booking).time}
                                </div>
                                <div className="flex items-center gap-1">
                                    <User className="h-4 w-4" />
                                    {booking.gig?.duration} min
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        {right ?? (
                            <Badge className={getStatusColor(booking.status)}>{booking.status}</Badge>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    )

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="animate-pulse">
                    <div className="h-8 bg-gray-200 rounded w-48 mb-4"></div>
                    <div className="space-y-4">
                        {Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
                        ))}
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Bookings</h1>
                <p className="text-gray-600 mt-2">Manage your class bookings and requests.</p>
            </div>

            {error && (
                <div className="text-center text-red-600 p-4 bg-red-50 rounded-lg">{error}</div>
            )}

            {/* 1) Requests (Pending) with serial numbers */}
            <section className="space-y-3">
                <Card className="border-0 shadow-none">
                    <CardHeader className="px-0 pt-0">
                        <CardTitle className="text-xl">Requests</CardTitle>
                    </CardHeader>
                </Card>
                {requestBookings.length === 0 ? (
                    <Card className="bg-white shadow-sm border-0">
                        <CardContent className="p-6 text-center text-gray-600">No pending requests</CardContent>
                    </Card>
                ) : (
                    requestBookings.map((booking, idx) => (
                        <BookingItem
                            key={booking._id}
                            booking={booking}
                            right={
                                <div className="flex items-center gap-3">
                                    <span className="text-xs text-gray-500">#{idx + 1}</span>
                                    <div className="flex gap-2">
                                        <Button
                                            size="sm"
                                            onClick={() => handleAccept(booking._id)}
                                            className="bg-green-600 hover:bg-green-700"
                                        >
                                            <CheckCircle className="h-4 w-4 mr-1" />
                                            Accept
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => handleReject(booking._id)}
                                            className="text-red-600 border-red-600 hover:bg-red-50"
                                        >
                                            <XCircle className="h-4 w-4 mr-1" />
                                            Reject
                                        </Button>
                                    </div>
                                </div>
                            }
                        />
                    ))
                )}
            </section>

            {/* 2) Accepted Bookings */}
            <section className="space-y-3">
                <Card className="border-0 shadow-none">
                    <CardHeader className="px-0 pt-0">
                        <CardTitle className="text-xl">Accepted Bookings</CardTitle>
                    </CardHeader>
                </Card>
                {acceptedBookings.length === 0 ? (
                    <Card className="bg-white shadow-sm border-0">
                        <CardContent className="p-6 text-center text-gray-600">No accepted bookings</CardContent>
                    </Card>
                ) : (
                    acceptedBookings.map((booking) => {
                        const manualPayment = manualPaymentMap[booking._id]
                        const paymentStatus = manualPayment?.paymentStatus
                        const needsVerification = paymentStatus === 'submitted'
                        
                        return (
                            <BookingItem
                                key={booking._id}
                                booking={booking}
                                right={
                                    <div className="flex items-center gap-2 flex-wrap justify-end">
                                        <Badge className={getStatusColor(booking.status)}>{booking.status}</Badge>
                                        {/* Show manual payment status if available */}
                                        {paymentStatus && getManualPaymentStatusBadge(paymentStatus)}
                                        {/* Show legacy paid/unpaid badge if no manual payment */}
                                        {!paymentStatus && (
                                            paidMap[booking._id] ? (
                                                <Badge className="bg-green-100 text-green-800">Paid</Badge>
                                            ) : (
                                                <Badge className="bg-yellow-100 text-yellow-800">Unpaid</Badge>
                                            )
                                        )}
                                        {/* Teacher verification button when payment submitted */}
                                        {needsVerification && (
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => setVerifyingBooking(booking)}
                                                className="border-blue-500 text-blue-600 hover:bg-blue-50"
                                            >
                                                <Eye className="h-4 w-4 mr-1" />
                                                Review Payment
                                            </Button>
                                        )}
                                        <Button
                                            size="sm"
                                            onClick={() => handleJoinAccepted(booking)}
                                            className={`${isJoinEnabled(booking) && paidMap[booking._id] ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-200 text-gray-600'}`}
                                            disabled={!isJoinEnabled(booking) || !paidMap[booking._id] || (!booking?.meetingLink && !booking?.meetingRoomId)}
                                        >
                                            <Video className="h-4 w-4 mr-1" />
                                            {isJoinEnabled(booking) ? 'Join Now' : 'Join Class'}
                                        </Button>
                                    </div>
                                }
                            />
                        )
                    })
                )}
            </section>

            {/* 3) Rejected Bookings */}
            <section className="space-y-3">
                <Card className="border-0 shadow-none">
                    <CardHeader className="px-0 pt-0">
                        <CardTitle className="text-xl">Rejected Bookings</CardTitle>
                    </CardHeader>
                </Card>
                {rejectedBookings.length === 0 ? (
                    <Card className="bg-white shadow-sm border-0">
                        <CardContent className="p-6 text-center text-gray-600">No rejected bookings</CardContent>
                    </Card>
                ) : (
                    rejectedBookings.map((booking) => (
                        <BookingItem key={booking._id} booking={booking} />
                    ))
                )}
            </section>

            {/* Payment Verification Dialog */}
            {verifyingBooking && (
                <Dialog open={!!verifyingBooking && !rejectDialogOpen} onOpenChange={(open) => !open && setVerifyingBooking(null)}>
                    <DialogContent className="max-w-lg">
                        <DialogHeader>
                            <DialogTitle>Review Payment Proof</DialogTitle>
                            <DialogDescription>
                                Verify the payment details submitted by {verifyingBooking.student?.name}
                            </DialogDescription>
                        </DialogHeader>
                        
                        {manualPaymentMap[verifyingBooking._id] && (
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <p className="text-gray-500">Class</p>
                                        <p className="font-medium">{verifyingBooking.gig?.title}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-500">Amount Expected</p>
                                        <p className="font-medium text-green-600">৳{manualPaymentMap[verifyingBooking._id]?.amountExpected}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-500">Payment Method</p>
                                        <p className="font-medium capitalize">{manualPaymentMap[verifyingBooking._id]?.method}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-500">Amount Paid</p>
                                        <p className="font-medium">৳{manualPaymentMap[verifyingBooking._id]?.amountPaid}</p>
                                    </div>
                                    <div className="col-span-2">
                                        <p className="text-gray-500">Transaction ID</p>
                                        <p className="font-mono font-medium bg-gray-100 px-2 py-1 rounded">
                                            {manualPaymentMap[verifyingBooking._id]?.trxid}
                                        </p>
                                    </div>
                                    {manualPaymentMap[verifyingBooking._id]?.senderNumber && (
                                        <div>
                                            <p className="text-gray-500">Sender Number</p>
                                            <p className="font-medium">{manualPaymentMap[verifyingBooking._id]?.senderNumber}</p>
                                        </div>
                                    )}
                                    <div>
                                        <p className="text-gray-500">Submitted At</p>
                                        <p className="font-medium">
                                            {manualPaymentMap[verifyingBooking._id]?.submittedAt 
                                                ? new Date(manualPaymentMap[verifyingBooking._id].submittedAt).toLocaleString()
                                                : 'N/A'}
                                        </p>
                                    </div>
                                </div>
                                
                                {manualPaymentMap[verifyingBooking._id]?.screenshotUrl && (
                                    <div>
                                        <p className="text-gray-500 text-sm mb-2">Payment Screenshot</p>
                                        <img 
                                            src={manualPaymentMap[verifyingBooking._id].screenshotUrl} 
                                            alt="Payment screenshot"
                                            className="max-w-full rounded-lg border"
                                        />
                                    </div>
                                )}
                            </div>
                        )}
                        
                        <DialogFooter className="gap-2">
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setRejectDialogOpen(true)
                                }}
                                disabled={actionLoading}
                                className="text-red-600 border-red-300 hover:bg-red-50"
                            >
                                <X className="h-4 w-4 mr-1" />
                                Reject
                            </Button>
                            <Button
                                onClick={() => handleVerifyPayment(verifyingBooking._id)}
                                disabled={actionLoading}
                                className="bg-green-600 hover:bg-green-700"
                            >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                {actionLoading ? 'Verifying...' : 'Verify Payment'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}

            {/* Reject Reason Dialog */}
            <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Reject Payment</DialogTitle>
                        <DialogDescription>
                            Please provide a reason for rejecting this payment. The student will be notified.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-2">
                        <Label htmlFor="rejectReason">Rejection Reason</Label>
                        <Textarea
                            id="rejectReason"
                            placeholder="e.g., Transaction ID not found, amount mismatch, etc."
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            rows={3}
                        />
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setRejectDialogOpen(false)
                                setRejectReason("")
                            }}
                            disabled={actionLoading}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleRejectPayment}
                            disabled={actionLoading || !rejectReason.trim()}
                            variant="destructive"
                        >
                            {actionLoading ? 'Rejecting...' : 'Confirm Rejection'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
