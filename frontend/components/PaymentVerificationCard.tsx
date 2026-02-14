"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { bookingsApi } from "@/services/api"
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  CreditCard, 
  Phone, 
  Building2,
  Image as ImageIcon,
  Loader2,
  ExternalLink
} from "lucide-react"

interface ManualPayment {
  status: 'pending_manual' | 'submitted' | 'verified' | 'rejected' | 'expired'
  method?: 'bkash' | 'nagad' | 'bank'
  amountExpected?: number
  amountPaid?: number
  trxid?: string
  senderNumber?: string
  screenshotUrl?: string
  submittedAt?: string
  verifiedAt?: string
  rejectedAt?: string
  rejectReason?: string
  submissionCount: number
}

interface PaymentVerificationCardProps {
  bookingId: string
  manualPayment: ManualPayment
  paymentRefCode?: string
  studentName?: string
  gigTitle?: string
  onStatusChange?: () => void
}

const REJECTION_REASONS = [
  "Transaction ID not found in records",
  "Amount mismatch - paid amount differs from expected",
  "Invalid or duplicate transaction ID",
  "Screenshot does not match transaction details",
  "Payment not received",
  "Other (please specify)",
]

export default function PaymentVerificationCard({
  bookingId,
  manualPayment,
  paymentRefCode,
  studentName,
  gigTitle,
  onStatusChange,
}: PaymentVerificationCardProps) {
  const { toast } = useToast()
  const [verifying, setVerifying] = useState(false)
  const [rejecting, setRejecting] = useState(false)
  const [showRejectDialog, setShowRejectDialog] = useState(false)
  const [rejectReason, setRejectReason] = useState("")
  const [customReason, setCustomReason] = useState("")

  const handleVerify = async () => {
    setVerifying(true)
    try {
      await bookingsApi.verifyPayment(bookingId)
      toast({ title: "Success", description: "Payment verified! Student can now join the class." })
      onStatusChange?.()
    } catch (err: any) {
      toast({
        title: "Error",
        description: err?.response?.data?.message || "Failed to verify payment",
        variant: "destructive"
      })
    } finally {
      setVerifying(false)
    }
  }

  const handleReject = async () => {
    const reason = rejectReason === "Other (please specify)" ? customReason : rejectReason
    if (!reason.trim()) {
      toast({ title: "Error", description: "Please provide a rejection reason", variant: "destructive" })
      return
    }

    setRejecting(true)
    try {
      await bookingsApi.rejectPayment(bookingId, reason)
      toast({ title: "Rejected", description: "Payment rejected. Student will be notified." })
      setShowRejectDialog(false)
      onStatusChange?.()
    } catch (err: any) {
      toast({
        title: "Error",
        description: err?.response?.data?.message || "Failed to reject payment",
        variant: "destructive"
      })
    } finally {
      setRejecting(false)
    }
  }

  const getStatusBadge = () => {
    switch (manualPayment.status) {
      case 'pending_manual':
        return <Badge className="bg-yellow-100 text-yellow-800">Awaiting Payment</Badge>
      case 'submitted':
        return <Badge className="bg-blue-100 text-blue-800">Proof Submitted</Badge>
      case 'verified':
        return <Badge className="bg-green-100 text-green-800">Verified</Badge>
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800">Rejected</Badge>
      case 'expired':
        return <Badge className="bg-gray-100 text-gray-800">Expired</Badge>
      default:
        return <Badge>{manualPayment.status}</Badge>
    }
  }

  const getMethodIcon = () => {
    switch (manualPayment.method) {
      case 'bkash':
        return <Phone className="h-4 w-4 text-pink-600" />
      case 'nagad':
        return <Phone className="h-4 w-4 text-orange-600" />
      case 'bank':
        return <Building2 className="h-4 w-4 text-gray-600" />
      default:
        return <CreditCard className="h-4 w-4" />
    }
  }

  // Only show for manual payment bookings with submitted status (needs verification)
  if (manualPayment.status !== 'submitted') {
    // Show minimal status info for other states
    return (
      <Card className={`border-l-4 ${
        manualPayment.status === 'verified' ? 'border-l-green-500 bg-green-50' :
        manualPayment.status === 'rejected' ? 'border-l-red-500 bg-red-50' :
        manualPayment.status === 'expired' ? 'border-l-gray-500 bg-gray-50' :
        'border-l-yellow-500 bg-yellow-50'
      }`}>
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-gray-500" />
              <span className="font-medium">Manual Payment</span>
              {getStatusBadge()}
            </div>
            {manualPayment.status === 'verified' && (
              <CheckCircle className="h-5 w-5 text-green-600" />
            )}
          </div>
          {manualPayment.status === 'rejected' && manualPayment.rejectReason && (
            <p className="text-sm text-red-700 mt-2">
              <strong>Reason:</strong> {manualPayment.rejectReason}
            </p>
          )}
        </CardContent>
      </Card>
    )
  }

  // Full verification card for submitted payments
  return (
    <>
      <Card className="border-l-4 border-l-blue-500 bg-blue-50">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Payment Verification Required
            </CardTitle>
            {getStatusBadge()}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Student & Gig Info */}
          <div className="bg-white rounded-lg p-3 space-y-1">
            {studentName && (
              <p className="text-sm"><strong>Student:</strong> {studentName}</p>
            )}
            {gigTitle && (
              <p className="text-sm"><strong>Class:</strong> {gigTitle}</p>
            )}
            {paymentRefCode && (
              <p className="text-sm"><strong>Reference:</strong> <code className="bg-gray-100 px-1 rounded">{paymentRefCode}</code></p>
            )}
          </div>

          {/* Payment Details */}
          <div className="bg-white rounded-lg p-3 space-y-2">
            <div className="flex items-center gap-2">
              {getMethodIcon()}
              <span className="font-medium capitalize">{manualPayment.method}</span>
            </div>
            
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-gray-600">Transaction ID:</span>
                <p className="font-mono font-medium">{manualPayment.trxid}</p>
              </div>
              <div>
                <span className="text-gray-600">Amount Paid:</span>
                <p className="font-medium">৳{manualPayment.amountPaid || manualPayment.amountExpected}</p>
              </div>
              {manualPayment.senderNumber && (
                <div>
                  <span className="text-gray-600">Sender:</span>
                  <p className="font-medium">{manualPayment.senderNumber}</p>
                </div>
              )}
              <div>
                <span className="text-gray-600">Submitted:</span>
                <p className="font-medium">
                  {manualPayment.submittedAt 
                    ? new Date(manualPayment.submittedAt).toLocaleString() 
                    : 'N/A'}
                </p>
              </div>
            </div>

            {manualPayment.screenshotUrl && (
              <div className="pt-2">
                <a 
                  href={manualPayment.screenshotUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-blue-600 hover:underline text-sm"
                >
                  <ImageIcon className="h-4 w-4" />
                  View Screenshot
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            )}
          </div>

          {/* Submission Count */}
          <p className="text-xs text-gray-600">
            Submission #{manualPayment.submissionCount}
          </p>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <Button
              onClick={handleVerify}
              disabled={verifying}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              {verifying ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle className="h-4 w-4 mr-2" />
              )}
              Verify Payment
            </Button>
            <Button
              onClick={() => setShowRejectDialog(true)}
              disabled={rejecting}
              variant="outline"
              className="flex-1 text-red-600 border-red-600 hover:bg-red-50"
            >
              <XCircle className="h-4 w-4 mr-2" />
              Reject
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Payment</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this payment. The student will be notified.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Rejection Reason</Label>
              <Select value={rejectReason} onValueChange={setRejectReason}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a reason..." />
                </SelectTrigger>
                <SelectContent>
                  {REJECTION_REASONS.map((reason) => (
                    <SelectItem key={reason} value={reason}>
                      {reason}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {rejectReason === "Other (please specify)" && (
              <div className="space-y-2">
                <Label>Custom Reason</Label>
                <Input
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  placeholder="Enter your reason..."
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleReject} 
              disabled={rejecting || (!rejectReason || (rejectReason === "Other (please specify)" && !customReason))}
              variant="destructive"
            >
              {rejecting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Confirm Rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
