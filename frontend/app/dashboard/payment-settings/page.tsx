"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { manualPaymentApi } from "@/services/api"
import { Loader2, Save, CreditCard, Smartphone, Building2, Info } from "lucide-react"

interface PaymentInfo {
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

export default function PaymentSettingsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [paymentInfo, setPaymentInfo] = useState<PaymentInfo>({})
  const { toast } = useToast()

  useEffect(() => {
    fetchPaymentInfo()
  }, [])

  const fetchPaymentInfo = async () => {
    try {
      setLoading(true)
      const res = await manualPaymentApi.getMyPaymentInfo()
      if (res.data) {
        setPaymentInfo(res.data)
      }
    } catch (error: any) {
      if (error?.response?.status !== 404) {
        toast({
          title: "Error",
          description: "Failed to load payment settings",
          variant: "destructive",
        })
      }
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      
      // Validate at least one payment method
      const hasMethod = paymentInfo.bkashNumber || paymentInfo.nagadNumber || 
        (paymentInfo.bankAccountNumber && paymentInfo.bankName)
      
      if (!hasMethod) {
        toast({
          title: "Validation Error",
          description: "Please provide at least one payment method (bKash, Nagad, or Bank details)",
          variant: "destructive",
        })
        return
      }

      const res = await manualPaymentApi.updateMyPaymentInfo(paymentInfo)
      setPaymentInfo(res.data)
      toast({
        title: "Success",
        description: "Payment settings saved successfully",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.response?.data?.message || "Failed to save payment settings",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const updateField = (field: keyof PaymentInfo, value: string) => {
    setPaymentInfo(prev => ({ ...prev, [field]: value }))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading payment settings...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Payment Settings</h1>
        <p className="text-gray-600 mt-2">
          Configure your payment details for receiving payments from students.
        </p>
      </div>

      {/* Info Banner */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex gap-3">
            <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">How Manual Payment Works</p>
              <p>
                When a student books your class and you accept it, they will see your payment details 
                and can pay you directly via bKash, Nagad, or Bank transfer. After payment, they submit 
                the transaction ID for your verification.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Mobile Banking Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            Mobile Banking
          </CardTitle>
          <CardDescription>
            Add your bKash and Nagad numbers for mobile payments
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="bkashNumber">bKash Number</Label>
              <Input
                id="bkashNumber"
                placeholder="01XXXXXXXXX"
                value={paymentInfo.bkashNumber || ""}
                onChange={(e) => updateField("bkashNumber", e.target.value)}
                maxLength={15}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nagadNumber">Nagad Number</Label>
              <Input
                id="nagadNumber"
                placeholder="01XXXXXXXXX"
                value={paymentInfo.nagadNumber || ""}
                onChange={(e) => updateField("nagadNumber", e.target.value)}
                maxLength={15}
              />
            </div>
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
            Add your bank account details for bank transfers
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="bankAccountName">Account Holder Name</Label>
              <Input
                id="bankAccountName"
                placeholder="Your full name as on bank account"
                value={paymentInfo.bankAccountName || ""}
                onChange={(e) => updateField("bankAccountName", e.target.value)}
                maxLength={100}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bankAccountNumber">Account Number</Label>
              <Input
                id="bankAccountNumber"
                placeholder="Your bank account number"
                value={paymentInfo.bankAccountNumber || ""}
                onChange={(e) => updateField("bankAccountNumber", e.target.value)}
                maxLength={30}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bankName">Bank Name</Label>
              <Input
                id="bankName"
                placeholder="e.g., Dutch Bangla Bank"
                value={paymentInfo.bankName || ""}
                onChange={(e) => updateField("bankName", e.target.value)}
                maxLength={100}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bankBranch">Branch Name</Label>
              <Input
                id="bankBranch"
                placeholder="e.g., Gulshan Branch"
                value={paymentInfo.bankBranch || ""}
                onChange={(e) => updateField("bankBranch", e.target.value)}
                maxLength={100}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="routingNumber">Routing Number (Optional)</Label>
              <Input
                id="routingNumber"
                placeholder="Bank routing number"
                value={paymentInfo.routingNumber || ""}
                onChange={(e) => updateField("routingNumber", e.target.value)}
                maxLength={20}
              />
            </div>
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
            Add any special instructions for students making payments
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="instructions">Instructions (Optional)</Label>
            <Textarea
              id="instructions"
              placeholder="e.g., Please use your booking reference code as payment reference. Send money to personal account, not merchant."
              value={paymentInfo.instructions || ""}
              onChange={(e) => updateField("instructions", e.target.value)}
              maxLength={500}
              rows={4}
            />
            <p className="text-xs text-gray-500">
              {(paymentInfo.instructions?.length || 0)}/500 characters
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-500">
          {paymentInfo.updatedAt && (
            <span>Last updated: {new Date(paymentInfo.updatedAt).toLocaleString()}</span>
          )}
        </div>
        <Button onClick={handleSave} disabled={saving} size="lg">
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Payment Settings
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
