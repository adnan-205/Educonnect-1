"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { teacherPaymentApi } from "@/services/api"
import { 
  Loader2, 
  Save, 
  Phone, 
  Building2, 
  CreditCard,
  CheckCircle,
  AlertCircle
} from "lucide-react"

interface PaymentInfo {
  bkashNumber?: string
  nagadNumber?: string
  bankDetails?: {
    bankName?: string
    accountNumber?: string
    accountName?: string
    branchName?: string
    routingNumber?: string
  }
  accountName?: string
  instructions?: string
}

export default function TeacherPaymentInfoPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [hasData, setHasData] = useState(false)

  // Form state
  const [bkashNumber, setBkashNumber] = useState("")
  const [nagadNumber, setNagadNumber] = useState("")
  const [accountName, setAccountName] = useState("")
  const [instructions, setInstructions] = useState("")
  const [bankName, setBankName] = useState("")
  const [bankAccountNumber, setBankAccountNumber] = useState("")
  const [bankAccountName, setBankAccountName] = useState("")
  const [bankBranchName, setBankBranchName] = useState("")
  const [bankRoutingNumber, setBankRoutingNumber] = useState("")

  useEffect(() => {
    loadPaymentInfo()
  }, [])

  const loadPaymentInfo = async () => {
    try {
      const res = await teacherPaymentApi.getMyPaymentInfo()
      const data = res.data as PaymentInfo | null
      if (data) {
        setHasData(true)
        setBkashNumber(data.bkashNumber || "")
        setNagadNumber(data.nagadNumber || "")
        setAccountName(data.accountName || "")
        setInstructions(data.instructions || "")
        setBankName(data.bankDetails?.bankName || "")
        setBankAccountNumber(data.bankDetails?.accountNumber || "")
        setBankAccountName(data.bankDetails?.accountName || "")
        setBankBranchName(data.bankDetails?.branchName || "")
        setBankRoutingNumber(data.bankDetails?.routingNumber || "")
      }
    } catch (err: any) {
      // 404 is expected if no payment info exists yet
      if (err?.response?.status !== 404) {
        toast({
          title: "Error",
          description: "Failed to load payment info",
          variant: "destructive"
        })
      }
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const payload: PaymentInfo = {
        bkashNumber: bkashNumber.trim() || undefined,
        nagadNumber: nagadNumber.trim() || undefined,
        accountName: accountName.trim() || undefined,
        instructions: instructions.trim() || undefined,
        bankDetails: (bankName.trim() || bankAccountNumber.trim()) ? {
          bankName: bankName.trim() || undefined,
          accountNumber: bankAccountNumber.trim() || undefined,
          accountName: bankAccountName.trim() || undefined,
          branchName: bankBranchName.trim() || undefined,
          routingNumber: bankRoutingNumber.trim() || undefined,
        } : undefined,
      }

      await teacherPaymentApi.updatePaymentInfo(payload)
      setHasData(true)
      toast({ title: "Saved!", description: "Your payment information has been updated." })
    } catch (err: any) {
      toast({
        title: "Error",
        description: err?.response?.data?.message || "Failed to save payment info",
        variant: "destructive"
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Payment Information</h1>
        <p className="text-gray-600 mt-2">
          Set up your payment details so students can pay you directly for manual payments.
        </p>
      </div>

      {!hasData && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="py-4 flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-yellow-600" />
            <p className="text-yellow-800">
              You haven't set up payment info yet. Add at least one payment method to receive payments.
            </p>
          </CardContent>
        </Card>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Mobile Money Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5" />
              Mobile Banking
            </CardTitle>
            <CardDescription>
              Add your bKash and Nagad numbers for mobile money payments.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bkash" className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-pink-500"></span>
                  bKash Number
                </Label>
                <Input
                  id="bkash"
                  value={bkashNumber}
                  onChange={(e) => setBkashNumber(e.target.value)}
                  placeholder="01XXXXXXXXX"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nagad" className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-orange-500"></span>
                  Nagad Number
                </Label>
                <Input
                  id="nagad"
                  value={nagadNumber}
                  onChange={(e) => setNagadNumber(e.target.value)}
                  placeholder="01XXXXXXXXX"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="accountName">Account Holder Name</Label>
              <Input
                id="accountName"
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                placeholder="Your registered name"
              />
              <p className="text-xs text-gray-500">The name registered with your mobile banking accounts</p>
            </div>
          </CardContent>
        </Card>

        {/* Bank Transfer Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Bank Transfer
            </CardTitle>
            <CardDescription>
              Add your bank account details for bank transfer payments.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bankName">Bank Name</Label>
                <Input
                  id="bankName"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  placeholder="e.g., Dutch-Bangla Bank"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bankAccountNumber">Account Number</Label>
                <Input
                  id="bankAccountNumber"
                  value={bankAccountNumber}
                  onChange={(e) => setBankAccountNumber(e.target.value)}
                  placeholder="Your account number"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bankAccountName">Account Holder Name</Label>
                <Input
                  id="bankAccountName"
                  value={bankAccountName}
                  onChange={(e) => setBankAccountName(e.target.value)}
                  placeholder="Name on account"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bankBranchName">Branch Name</Label>
                <Input
                  id="bankBranchName"
                  value={bankBranchName}
                  onChange={(e) => setBankBranchName(e.target.value)}
                  placeholder="e.g., Gulshan Branch"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="bankRoutingNumber">Routing Number (Optional)</Label>
              <Input
                id="bankRoutingNumber"
                value={bankRoutingNumber}
                onChange={(e) => setBankRoutingNumber(e.target.value)}
                placeholder="Bank routing number"
              />
            </div>
          </CardContent>
        </Card>

        {/* Instructions Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Payment Instructions
            </CardTitle>
            <CardDescription>
              Add any special instructions for students making payments.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="instructions">Instructions for Students</Label>
              <Textarea
                id="instructions"
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                placeholder="e.g., Please include your name and booking reference in the payment note. Send payment at least 1 hour before class time."
                rows={4}
              />
              <p className="text-xs text-gray-500">This will be shown to students when they make a payment</p>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button type="submit" disabled={saving} size="lg">
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Payment Info
              </>
            )}
          </Button>
        </div>
      </form>

      {hasData && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="py-4 flex items-center gap-3">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <p className="text-green-800">
              Your payment information is set up! Students will see these details when paying for classes.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
