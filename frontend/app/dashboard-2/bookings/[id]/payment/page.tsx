"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { manualPaymentApi, uploadsApi } from "@/services/api"
import { 
  Loader2, 
  Copy, 
  Check, 
  Upload, 
  Smartphone, 
  Building2, 
  Clock, 
  AlertCircle,
  CheckCircle,
  XCircle,
  RefreshCw
} from "lucide-react"

interface TeacherPaymentInfo {
  bkashNumber?: string
  nagadNumber?: string
  bankAccountName?: string
  bankAccountNumber?: string
  bankName?: string
  bankBranch?: string
  routingNumber?: string
  instructions?: string
  updatedAt?: string
}

interface PaymentData {
  bookingId: string
  paymentRefCode: string
  amountExpected: number
  teacherName: string
  teacherEmail?: string
  gigTitle: string
  paymentStatus: string
  submissionCount: number
  maxSubmissions: number
  teacherPaymentInfo: TeacherPaymentInfo
  submissionWindowHours: number
  acceptedAt?: string
}

type PaymentMethod = 'bkash' | 'nagad' | 'bank'

export default function PaymentBoardingPage() {
  const params = useParams()
  const router = useRouter()
  const bookingId = params.id as string
  const { toast } = useToast()

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [errorCode, setErrorCode] = useState<string | null>(null)

  // Form state
  const [method, setMethod] = useState<PaymentMethod>('bkash')
  const [trxid, setTrxid] = useState('')
  const [senderNumber, setSenderNumber] = useState('')
  const [screenshotUrl, setScreenshotUrl] = useState('')
  const [uploadingScreenshot, setUploadingScreenshot] = useState(false)

  // Copy state
  const [copiedField, setCopiedField] = useState<string | null>(null)

  // Polling for status updates
  const [polling, setPolling] = useState(false)

  const fetchPaymentInfo = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      setErrorCode(null)
      const res = await manualPaymentApi.getManualPaymentInfo(bookingId)
      setPaymentData(res.data)
    } catch (err: any) {
      const code = err?.response?.data?.code
      const message = err?.response?.data?.message || 'Failed to load payment information'
      setError(message)
      setErrorCode(code)
    } finally {
      setLoading(false)
    }
  }, [bookingId])

  useEffect(() => {
    fetchPaymentInfo()
  }, [fetchPaymentInfo])

  // Poll for status updates when waiting for verification
  useEffect(() => {
    if (paymentData?.paymentStatus === 'submitted') {
      setPolling(true)
      const interval = setInterval(async () => {
        // Skip polling when tab is hidden
        if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return
        try {
          const res = await manualPaymentApi.getPaymentStatus(bookingId)
          if (res.data?.paymentStatus !== 'submitted') {
            setPaymentData(prev => prev ? { ...prev, paymentStatus: res.data.paymentStatus } : null)
            clearInterval(interval)
            setPolling(false)
            
            if (res.data.paymentStatus === 'verified') {
              toast({
                title: "Payment Verified!",
                description: "Your payment has been verified. You can now join the class.",
              })
            } else if (res.data.paymentStatus === 'rejected') {
              toast({
                title: "Payment Rejected",
                description: res.data.rejectReason || "Please check the details and try again.",
                variant: "destructive",
              })
              fetchPaymentInfo() // Refresh to get updated data
            }
          }
        } catch {
          // Ignore polling errors
        }
      }, 10000) // Poll every 10 seconds

      // Stop polling after 30 minutes to prevent zombie polls
      const maxPollTimer = setTimeout(() => {
        clearInterval(interval)
        setPolling(false)
      }, 30 * 60 * 1000)

      return () => {
        clearInterval(interval)
        clearTimeout(maxPollTimer)
      }
    }
  }, [paymentData?.paymentStatus, bookingId, toast, fetchPaymentInfo])

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedField(field)
      setTimeout(() => setCopiedField(null), 2000)
    } catch {
      toast({
        title: "Copy Failed",
        description: "Please copy manually",
        variant: "destructive",
      })
    }
  }

  const handleScreenshotUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Screenshot must be less than 5MB",
        variant: "destructive",
      })
      return
    }

    try {
      setUploadingScreenshot(true)
      const res = await uploadsApi.uploadImage(file, 'payment-screenshots')
      setScreenshotUrl(res.data?.url || res.url)
      toast({
        title: "Screenshot Uploaded",
        description: "Screenshot uploaded successfully",
      })
    } catch {
      toast({
        title: "Upload Failed",
        description: "Failed to upload screenshot",
        variant: "destructive",
      })
    } finally {
      setUploadingScreenshot(false)
    }
  }

  const handleSubmit = async () => {
    if (!trxid.trim()) {
      toast({
        title: "Validation Error",
        description: "Transaction ID is required",
        variant: "destructive",
      })
      return
    }

    try {
      setSubmitting(true)
      await manualPaymentApi.submitPaymentProof(bookingId, {
        method,
        trxid: trxid.trim(),
        senderNumber: senderNumber.trim() || undefined,
        amountPaid: paymentData?.amountExpected,
        screenshotUrl: screenshotUrl || undefined,
      })
      
      toast({
        title: "Payment Proof Submitted",
        description: "Waiting for teacher verification...",
      })
      
      // Refresh data
      fetchPaymentInfo()
    } catch (err: any) {
      const code = err?.response?.data?.code
      const message = err?.response?.data?.message || 'Failed to submit payment proof'
      
      if (code === 'DUPLICATE_TRXID') {
        toast({
          title: "Duplicate Transaction ID",
          description: "This transaction ID has already been used. Please provide a unique one.",
          variant: "destructive",
        })
      } else {
        toast({
          title: "Submission Failed",
          description: message,
          variant: "destructive",
        })
      }
    } finally {
      setSubmitting(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending_manual':
        return <Badge className="bg-yellow-100 text-yellow-800">Payment Required</Badge>
      case 'submitted':
        return <Badge className="bg-blue-100 text-blue-800">Awaiting Verification</Badge>
      case 'verified':
        return <Badge className="bg-green-100 text-green-800">Verified</Badge>
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800">Rejected</Badge>
      case 'expired':
        return <Badge className="bg-gray-100 text-gray-800">Expired</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading payment details...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-6 w-6 text-red-600 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-red-800 mb-1">Unable to Load Payment</h3>
                <p className="text-red-700">{error}</p>
                {errorCode === 'TEACHER_PAYMENT_INFO_MISSING' && (
                  <p className="text-sm text-red-600 mt-2">
                    The teacher hasn't set up their payment details yet. Please contact them directly.
                  </p>
                )}
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => router.back()}
                >
                  Go Back
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!paymentData) return null

  const { teacherPaymentInfo } = paymentData

  // Verified - show success and join button
  if (paymentData.paymentStatus === 'verified') {
    return (
      <div className="max-w-2xl mx-auto">
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-8 text-center">
            <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-green-800 mb-2">Payment Verified!</h2>
            <p className="text-green-700 mb-6">
              Your payment has been verified by {paymentData.teacherName}. You can now join the class.
            </p>
            <Button 
              size="lg"
              onClick={() => router.push(`/dashboard-2/join-class`)}
              className="bg-green-600 hover:bg-green-700"
            >
              Go to Join Class
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Submitted - waiting for verification
  if (paymentData.paymentStatus === 'submitted') {
    return (
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardContent className="p-8 text-center">
            <div className="relative inline-block mb-4">
              <Clock className="h-16 w-16 text-blue-600" />
              {polling && (
                <RefreshCw className="h-6 w-6 text-blue-600 absolute -right-2 -bottom-2 animate-spin" />
              )}
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Waiting for Verification</h2>
            <p className="text-gray-600 mb-4">
              Your payment proof has been submitted. {paymentData.teacherName} will verify it shortly.
            </p>
            <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
              <p className="text-sm text-gray-500 mb-1">Reference Code</p>
              <p className="font-mono font-semibold">{paymentData.paymentRefCode}</p>
            </div>
            <p className="text-sm text-gray-500">
              This page will automatically update when the teacher responds.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Expired
  if (paymentData.paymentStatus === 'expired') {
    return (
      <div className="max-w-2xl mx-auto">
        <Card className="border-gray-200 bg-gray-50">
          <CardContent className="p-8 text-center">
            <XCircle className="h-16 w-16 text-gray-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Payment Window Expired</h2>
            <p className="text-gray-600 mb-6">
              The payment submission window has expired. Please contact the teacher or book a new session.
            </p>
            <Button variant="outline" onClick={() => router.back()}>
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Max submissions reached
  if (paymentData.submissionCount >= paymentData.maxSubmissions) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-16 w-16 text-orange-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-orange-800 mb-2">Maximum Attempts Reached</h2>
            <p className="text-orange-700 mb-6">
              You've reached the maximum number of submission attempts ({paymentData.maxSubmissions}). 
              Please contact support for assistance.
            </p>
            <Button variant="outline" onClick={() => router.back()}>
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Payment form (pending_manual or rejected)
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Complete Payment</h1>
        <p className="text-gray-600 mt-1">
          Pay for: <span className="font-medium">{paymentData.gigTitle}</span>
        </p>
      </div>

      {/* Rejected Warning */}
      {paymentData.paymentStatus === 'rejected' && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <XCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-red-800">Previous submission was rejected</p>
                <p className="text-sm text-red-700">
                  Please check your transaction details and try again. 
                  Attempts: {paymentData.submissionCount}/{paymentData.maxSubmissions}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payment Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Amount</p>
              <p className="text-2xl font-bold text-green-600">৳{paymentData.amountExpected}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Teacher</p>
              <p className="font-medium">{paymentData.teacherName}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Reference Code</p>
              <div className="flex items-center gap-2">
                <code className="bg-gray-100 px-2 py-1 rounded font-mono text-sm">
                  {paymentData.paymentRefCode}
                </code>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(paymentData.paymentRefCode, 'refCode')}
                >
                  {copiedField === 'refCode' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-500">Status</p>
              {getStatusBadge(paymentData.paymentStatus)}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Teacher Payment Details */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Methods</CardTitle>
          <CardDescription>
            Choose a payment method and send the exact amount to the teacher
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* bKash */}
          {teacherPaymentInfo.bkashNumber && (
            <div 
              className={`p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                method === 'bkash' ? 'border-pink-500 bg-pink-50' : 'border-gray-200 hover:border-pink-300'
              }`}
              onClick={() => setMethod('bkash')}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-pink-600 rounded-lg flex items-center justify-center">
                    <Smartphone className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="font-medium">bKash</p>
                    <p className="text-lg font-mono">{teacherPaymentInfo.bkashNumber}</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    copyToClipboard(teacherPaymentInfo.bkashNumber!, 'bkash')
                  }}
                >
                  {copiedField === 'bkash' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          )}

          {/* Nagad */}
          {teacherPaymentInfo.nagadNumber && (
            <div 
              className={`p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                method === 'nagad' ? 'border-orange-500 bg-orange-50' : 'border-gray-200 hover:border-orange-300'
              }`}
              onClick={() => setMethod('nagad')}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-orange-600 rounded-lg flex items-center justify-center">
                    <Smartphone className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="font-medium">Nagad</p>
                    <p className="text-lg font-mono">{teacherPaymentInfo.nagadNumber}</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    copyToClipboard(teacherPaymentInfo.nagadNumber!, 'nagad')
                  }}
                >
                  {copiedField === 'nagad' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          )}

          {/* Bank */}
          {teacherPaymentInfo.bankAccountNumber && teacherPaymentInfo.bankName && (
            <div 
              className={`p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                method === 'bank' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300'
              }`}
              onClick={() => setMethod('bank')}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                    <Building2 className="h-5 w-5 text-white" />
                  </div>
                  <div className="space-y-1">
                    <p className="font-medium">Bank Transfer</p>
                    <p className="text-sm text-gray-600">{teacherPaymentInfo.bankName}</p>
                    {teacherPaymentInfo.bankBranch && (
                      <p className="text-sm text-gray-500">{teacherPaymentInfo.bankBranch}</p>
                    )}
                    <p className="font-mono">{teacherPaymentInfo.bankAccountNumber}</p>
                    {teacherPaymentInfo.bankAccountName && (
                      <p className="text-sm text-gray-600">A/C: {teacherPaymentInfo.bankAccountName}</p>
                    )}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    copyToClipboard(teacherPaymentInfo.bankAccountNumber!, 'bank')
                  }}
                >
                  {copiedField === 'bank' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          )}

          {/* Instructions */}
          {teacherPaymentInfo.instructions && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm font-medium text-yellow-800 mb-1">Teacher's Instructions</p>
              <p className="text-sm text-yellow-700">{teacherPaymentInfo.instructions}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Submit Payment Proof */}
      <Card>
        <CardHeader>
          <CardTitle>Submit Payment Proof</CardTitle>
          <CardDescription>
            After completing the payment, enter the transaction details below
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="trxid">Transaction ID / Reference Number *</Label>
            <Input
              id="trxid"
              placeholder="Enter the transaction ID from your payment"
              value={trxid}
              onChange={(e) => setTrxid(e.target.value)}
              maxLength={100}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="senderNumber">Sender Number (Optional)</Label>
            <Input
              id="senderNumber"
              placeholder="Your bKash/Nagad number used for payment"
              value={senderNumber}
              onChange={(e) => setSenderNumber(e.target.value)}
              maxLength={20}
            />
          </div>

          <div className="space-y-2">
            <Label>Screenshot (Optional)</Label>
            <div className="flex items-center gap-4">
              <Input
                type="file"
                accept="image/*"
                onChange={handleScreenshotUpload}
                disabled={uploadingScreenshot}
                className="flex-1"
              />
              {uploadingScreenshot && <Loader2 className="h-5 w-5 animate-spin" />}
              {screenshotUrl && <Check className="h-5 w-5 text-green-600" />}
            </div>
            {screenshotUrl && (
              <p className="text-sm text-green-600">Screenshot uploaded successfully</p>
            )}
          </div>

          <Button 
            onClick={handleSubmit} 
            disabled={submitting || !trxid.trim()}
            className="w-full"
            size="lg"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Submit Payment Proof
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
