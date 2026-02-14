"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"
import { bookingsApi, teacherPaymentApi, uploadsApi } from "@/services/api"
import { 
  Loader2, 
  CreditCard, 
  Phone, 
  Building2, 
  Upload, 
  CheckCircle2, 
  Clock, 
  XCircle,
  AlertCircle,
  Copy,
  ArrowLeft
} from "lucide-react"

type PaymentMethod = 'bkash' | 'nagad' | 'bank'

interface TeacherPaymentInfo {
  bkashNumber?: string
  nagadNumber?: string
  accountName?: string
  instructions?: string
  bankDetails?: {
    bankName?: string
    accountNumber?: string
    accountName?: string
    branchName?: string
  }
}

interface ManualPaymentStatus {
  status: 'pending_manual' | 'submitted' | 'verified' | 'rejected' | 'expired'
  method?: PaymentMethod
  amountExpected?: number
  amountPaid?: number
  trxid?: string
  submittedAt?: string
  verifiedAt?: string
  rejectedAt?: string
  rejectReason?: string
  submissionCount: number
  maxSubmissions: number
  canSubmit: boolean
}

interface PaymentStatusData {
  bookingId: string
  paymentMethodType: string
  paymentRefCode: string
  manualPayment: ManualPaymentStatus
  joinUnlocked: boolean
  teacher: { _id: string; name: string }
  gigPrice: number
}

export default function PaymentBoardingPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const bookingId = params.id as string

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatusData | null>(null)
  const [teacherPaymentInfo, setTeacherPaymentInfo] = useState<TeacherPaymentInfo | null>(null)
  
  // Form state
  const [method, setMethod] = useState<PaymentMethod>('bkash')
  const [trxid, setTrxid] = useState('')
  const [senderNumber, setSenderNumber] = useState('')
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null)
  const [uploadingScreenshot, setUploadingScreenshot] = useState(false)

  useEffect(() => {
    loadPaymentData()
  }, [bookingId])

  // Poll for status updates when waiting for verification
  useEffect(() => {
    if (paymentStatus?.manualPayment?.status === 'submitted') {
      const interval = setInterval(loadPaymentData, 10000) // Poll every 10s
      return () => clearInterval(interval)
    }
  }, [paymentStatus?.manualPayment?.status])

  const loadPaymentData = async () => {
    try {
      const res = await bookingsApi.getPaymentStatus(bookingId)
      setPaymentStatus(res.data)

      // Fetch teacher payment info
      if (res.data?.teacher?._id) {
        try {
          const infoRes = await teacherPaymentApi.getTeacherPaymentInfo(res.data.teacher._id)
          setTeacherPaymentInfo(infoRes.data)
        } catch {
          // Teacher may not have set up payment info
        }
      }

      // If verified, redirect to join
      if (res.data?.joinUnlocked) {
        toast({ title: "Payment Verified!", description: "You can now join the class." })
        router.push(`/dashboard/join-class`)
      }
    } catch (err: any) {
      toast({
        title: "Error",
        description: err?.response?.data?.message || "Failed to load payment status",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!trxid.trim()) {
      toast({ title: "Error", description: "Transaction ID is required", variant: "destructive" })
      return
    }

    setSubmitting(true)
    try {
      let screenshotUrl: string | undefined

      // Upload screenshot if provided
      if (screenshotFile) {
        setUploadingScreenshot(true)
        try {
          const uploadRes = await uploadsApi.uploadImage(screenshotFile, 'payment-screenshots')
          screenshotUrl = uploadRes.data?.url
        } catch {
          toast({ title: "Warning", description: "Failed to upload screenshot, submitting without it" })
        }
        setUploadingScreenshot(false)
      }

      await bookingsApi.submitPaymentProof(bookingId, {
        method,
        trxid: trxid.trim(),
        senderNumber: senderNumber.trim() || undefined,
        amountPaid: paymentStatus?.manualPayment?.amountExpected,
        screenshotUrl,
      })

      toast({ title: "Success", description: "Payment proof submitted! Waiting for teacher verification." })
      loadPaymentData()
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Failed to submit payment proof"
      toast({ title: "Error", description: msg, variant: "destructive" })
    } finally {
      setSubmitting(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({ title: "Copied!", description: "Copied to clipboard" })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (!paymentStatus) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold">Payment information not found</h2>
        <Button onClick={() => router.back()} className="mt-4">
          <ArrowLeft className="h-4 w-4 mr-2" /> Go Back
        </Button>
      </div>
    )
  }

  const { manualPayment } = paymentStatus
  const status = manualPayment?.status || 'pending_manual'

  // Status-specific UI
  if (status === 'verified') {
    return (
      <div className="max-w-2xl mx-auto py-8">
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6 text-center">
            <CheckCircle2 className="h-16 w-16 text-green-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-green-800 mb-2">Payment Verified!</h2>
            <p className="text-green-700 mb-6">Your payment has been confirmed. You can now join the class.</p>
            <Button onClick={() => router.push('/dashboard/join-class')} className="bg-green-600 hover:bg-green-700">
              Go to Join Class
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (status === 'expired') {
    return (
      <div className="max-w-2xl mx-auto py-8">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6 text-center">
            <XCircle className="h-16 w-16 text-red-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-red-800 mb-2">Payment Window Expired</h2>
            <p className="text-red-700 mb-6">The payment window for this booking has expired. Please contact support or book a new session.</p>
            <Button onClick={() => router.push('/dashboard/bookings')} variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" /> Back to Bookings
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (status === 'submitted') {
    return (
      <div className="max-w-2xl mx-auto py-8">
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="pt-6 text-center">
            <Clock className="h-16 w-16 text-yellow-600 mx-auto mb-4 animate-pulse" />
            <h2 className="text-2xl font-bold text-yellow-800 mb-2">Waiting for Verification</h2>
            <p className="text-yellow-700 mb-4">
              Your payment proof has been submitted. The teacher will verify it shortly.
            </p>
            <div className="bg-white rounded-lg p-4 mb-6 text-left">
              <p className="text-sm text-gray-600">
                <strong>Method:</strong> {manualPayment.method?.toUpperCase()}
              </p>
              <p className="text-sm text-gray-600">
                <strong>Transaction ID:</strong> {manualPayment.trxid}
              </p>
              <p className="text-sm text-gray-600">
                <strong>Amount:</strong> ৳{manualPayment.amountPaid || manualPayment.amountExpected}
              </p>
              <p className="text-sm text-gray-600">
                <strong>Submitted:</strong> {manualPayment.submittedAt ? new Date(manualPayment.submittedAt).toLocaleString() : 'N/A'}
              </p>
            </div>
            <p className="text-sm text-gray-500">This page will auto-refresh when the teacher verifies your payment.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Show rejection message if rejected
  const showRejectionAlert = status === 'rejected' && manualPayment.canSubmit

  return (
    <div className="max-w-3xl mx-auto py-8 space-y-6">
      <Button variant="ghost" onClick={() => router.back()} className="mb-4">
        <ArrowLeft className="h-4 w-4 mr-2" /> Back
      </Button>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-6 w-6" />
            Complete Your Payment
          </CardTitle>
          <CardDescription>
            Pay the teacher directly and submit your transaction details for verification.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {showRejectionAlert && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Previous submission rejected:</strong> {manualPayment.rejectReason || 'No reason provided'}
                <br />
                <span className="text-sm">
                  You have {manualPayment.maxSubmissions - manualPayment.submissionCount} attempt(s) remaining.
                </span>
              </AlertDescription>
            </Alert>
          )}

          {/* Payment Amount */}
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-700">Amount to Pay</span>
              <span className="text-2xl font-bold text-blue-700">৳{manualPayment.amountExpected || paymentStatus.gigPrice}</span>
            </div>
            <div className="flex justify-between items-center mt-2 text-sm">
              <span className="text-gray-600">Reference Code</span>
              <div className="flex items-center gap-2">
                <code className="bg-white px-2 py-1 rounded">{paymentStatus.paymentRefCode}</code>
                <Button size="sm" variant="ghost" onClick={() => copyToClipboard(paymentStatus.paymentRefCode)}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Teacher Payment Info */}
          {teacherPaymentInfo && (
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900">Teacher Payment Details</h3>
              
              {teacherPaymentInfo.bkashNumber && (
                <div className="flex items-center gap-3 p-3 bg-pink-50 rounded-lg">
                  <Phone className="h-5 w-5 text-pink-600" />
                  <div className="flex-1">
                    <p className="text-sm text-gray-600">bKash</p>
                    <p className="font-medium">{teacherPaymentInfo.bkashNumber}</p>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => copyToClipboard(teacherPaymentInfo.bkashNumber!)}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              )}

              {teacherPaymentInfo.nagadNumber && (
                <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg">
                  <Phone className="h-5 w-5 text-orange-600" />
                  <div className="flex-1">
                    <p className="text-sm text-gray-600">Nagad</p>
                    <p className="font-medium">{teacherPaymentInfo.nagadNumber}</p>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => copyToClipboard(teacherPaymentInfo.nagadNumber!)}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              )}

              {teacherPaymentInfo.bankDetails?.bankName && (
                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <Building2 className="h-5 w-5 text-gray-600 mt-1" />
                  <div className="flex-1">
                    <p className="text-sm text-gray-600">Bank Transfer</p>
                    <p className="font-medium">{teacherPaymentInfo.bankDetails.bankName}</p>
                    <p className="text-sm text-gray-600">
                      {teacherPaymentInfo.bankDetails.accountName} • {teacherPaymentInfo.bankDetails.accountNumber}
                    </p>
                    {teacherPaymentInfo.bankDetails.branchName && (
                      <p className="text-sm text-gray-500">{teacherPaymentInfo.bankDetails.branchName}</p>
                    )}
                  </div>
                </div>
              )}

              {teacherPaymentInfo.instructions && (
                <div className="p-3 bg-yellow-50 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    <strong>Instructions:</strong> {teacherPaymentInfo.instructions}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Payment Form */}
          <form onSubmit={handleSubmit} className="space-y-4 pt-4 border-t">
            <h3 className="font-semibold text-gray-900">Submit Payment Proof</h3>

            <div className="space-y-2">
              <Label>Payment Method *</Label>
              <Select value={method} onValueChange={(v) => setMethod(v as PaymentMethod)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bkash">bKash</SelectItem>
                  <SelectItem value="nagad">Nagad</SelectItem>
                  <SelectItem value="bank">Bank Transfer</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Transaction ID *</Label>
              <Input
                value={trxid}
                onChange={(e) => setTrxid(e.target.value)}
                placeholder="Enter your transaction ID"
                required
              />
              <p className="text-xs text-gray-500">The unique transaction/reference number from your payment</p>
            </div>

            <div className="space-y-2">
              <Label>Sender Number (Optional)</Label>
              <Input
                value={senderNumber}
                onChange={(e) => setSenderNumber(e.target.value)}
                placeholder="Your bKash/Nagad number"
              />
            </div>

            <div className="space-y-2">
              <Label>Screenshot (Optional)</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setScreenshotFile(e.target.files?.[0] || null)}
                  className="flex-1"
                />
                {screenshotFile && (
                  <Badge variant="secondary">{screenshotFile.name}</Badge>
                )}
              </div>
              <p className="text-xs text-gray-500">Upload a screenshot of your payment confirmation</p>
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              disabled={submitting || uploadingScreenshot || !manualPayment.canSubmit}
            >
              {submitting || uploadingScreenshot ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {uploadingScreenshot ? 'Uploading...' : 'Submitting...'}
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Submit Payment Proof
                </>
              )}
            </Button>

            {!manualPayment.canSubmit && (
              <p className="text-sm text-red-600 text-center">
                Maximum submissions reached. Please contact admin for assistance.
              </p>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
