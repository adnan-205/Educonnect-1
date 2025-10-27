"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DollarSign, TrendingUp } from "lucide-react"
import { walletApi, api } from "@/services/api"
import { useUser } from "@clerk/nextjs"
import { useToast } from "@/hooks/use-toast"

type TxType = 'CREDIT' | 'WITHDRAWAL'
type TxStatus = 'PENDING' | 'COMPLETED' | 'REJECTED' | 'CANCELLED'

interface WalletSummary {
  balance: number
  totalEarned: number
  totalWithdrawn: number
  pendingWithdrawals: number
  availableForWithdrawal: number
  currency: string
}

export default function EarningsPage() {
  const { isLoaded, isSignedIn, user } = useUser()
  const { toast } = useToast()

  const [summary, setSummary] = useState<WalletSummary | null>(null)
  const [loadingSummary, setLoadingSummary] = useState(true)
  const [tx, setTx] = useState<any[]>([])
  const [loadingTx, setLoadingTx] = useState(true)

  // Withdraw modal state
  const [open, setOpen] = useState(false)
  const [amount, setAmount] = useState("")
  const [method, setMethod] = useState<'BANK_TRANSFER' | 'MOBILE_BANKING' | 'PAYPAL' | 'OTHER'>('BANK_TRANSFER')
  const [details, setDetails] = useState<Record<string, any>>({})
  const [withdrawing, setWithdrawing] = useState(false)

  useEffect(() => {
    const syncAndLoad = async () => {
      try {
        if (!isLoaded || !isSignedIn) return
        // Ensure backend token exists (Clerk sync)
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
        await Promise.all([loadSummary(), loadTransactions()])
      } finally {}
    }
    syncAndLoad()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, isSignedIn, user?.id])

  const loadSummary = async () => {
    try {
      setLoadingSummary(true)
      const res = await walletApi.getSummary()
      if (res?.success) setSummary(res.data)
    } catch (e: any) {
      toast({ title: 'Error', description: e?.response?.data?.message || 'Failed to load wallet summary', variant: 'destructive' })
    } finally {
      setLoadingSummary(false)
    }
  }

  const loadTransactions = async () => {
    try {
      setLoadingTx(true)
      const res = await walletApi.getTransactions({ limit: 10, skip: 0 })
      setTx(res?.data || [])
    } catch (e: any) {
      toast({ title: 'Error', description: e?.response?.data?.message || 'Failed to load transactions', variant: 'destructive' })
    } finally {
      setLoadingTx(false)
    }
  }

  const currency = summary?.currency || 'BDT'
  const fmt = (n?: number) => (n ?? 0).toLocaleString()

  const thisMonthEarnings = useMemo(() => {
    const now = new Date()
    const ym = `${now.getFullYear()}-${now.getMonth()}`
    const credits = (tx || []).filter(t => t.type === 'CREDIT')
    return credits.reduce((acc, t) => {
      const d = new Date(t.createdAt)
      const k = `${d.getFullYear()}-${d.getMonth()}`
      return acc + (k === ym ? (t.netAmount ?? t.amount ?? 0) : 0)
    }, 0)
  }, [tx])

  const handleSubmitWithdrawal = async () => {
    try {
      setWithdrawing(true)
      const payload: any = {
        amount: parseFloat(amount),
        withdrawalMethod: method,
        withdrawalDetails: details,
      }
      const res = await walletApi.requestWithdrawal(payload)
      if (res?.success) {
        toast({ title: 'Withdrawal Requested', description: 'Admin will review it shortly.' })
        setOpen(false)
        setAmount("")
        setDetails({})
        await Promise.all([loadSummary(), loadTransactions()])
      }
    } catch (e: any) {
      toast({ title: 'Error', description: e?.response?.data?.message || 'Failed to request withdrawal', variant: 'destructive' })
    } finally {
      setWithdrawing(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Earnings</h1>
          <p className="text-gray-600 mt-2">Your wallet balance, earnings and withdrawals.</p>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">Request Withdrawal</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Request Withdrawal</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div>
                <Label>Amount ({currency})</Label>
                <Input type="number" min={1} value={amount} onChange={e => setAmount(e.target.value)} placeholder="Enter amount" />
                {summary && (
                  <p className="text-xs text-gray-500 mt-1">Available: {currency} {fmt(summary.availableForWithdrawal)}</p>
                )}
              </div>
              <div>
                <Label>Method</Label>
                <Select value={method} onValueChange={(v: any) => setMethod(v)}>
                  <SelectTrigger><SelectValue placeholder="Select a method" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                    <SelectItem value="MOBILE_BANKING">Mobile Banking</SelectItem>
                    <SelectItem value="PAYPAL">PayPal</SelectItem>
                    <SelectItem value="OTHER">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {method === 'BANK_TRANSFER' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <Label>Account Number</Label>
                    <Input value={details.accountNumber || ''} onChange={e => setDetails({ ...details, accountNumber: e.target.value })} />
                  </div>
                  <div>
                    <Label>Account Name</Label>
                    <Input value={details.accountName || ''} onChange={e => setDetails({ ...details, accountName: e.target.value })} />
                  </div>
                  <div>
                    <Label>Bank Name</Label>
                    <Input value={details.bankName || ''} onChange={e => setDetails({ ...details, bankName: e.target.value })} />
                  </div>
                  <div>
                    <Label>Branch Name</Label>
                    <Input value={details.branchName || ''} onChange={e => setDetails({ ...details, branchName: e.target.value })} />
                  </div>
                  <div className="md:col-span-2">
                    <Label>Routing Number</Label>
                    <Input value={details.routingNumber || ''} onChange={e => setDetails({ ...details, routingNumber: e.target.value })} />
                  </div>
                </div>
              )}

              {method === 'MOBILE_BANKING' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <Label>Provider</Label>
                    <Input value={details.provider || ''} onChange={e => setDetails({ ...details, provider: e.target.value })} placeholder="bKash/Nagad/Rocket" />
                  </div>
                  <div>
                    <Label>Mobile Number</Label>
                    <Input value={details.mobileNumber || ''} onChange={e => setDetails({ ...details, mobileNumber: e.target.value })} />
                  </div>
                  <div className="md:col-span-2">
                    <Label>Account Name</Label>
                    <Input value={details.accountName || ''} onChange={e => setDetails({ ...details, accountName: e.target.value })} />
                  </div>
                </div>
              )}

              {method === 'PAYPAL' && (
                <div className="grid grid-cols-1 gap-3">
                  <div>
                    <Label>PayPal Email</Label>
                    <Input value={details.email || ''} onChange={e => setDetails({ ...details, email: e.target.value })} />
                  </div>
                  <div>
                    <Label>Account Name</Label>
                    <Input value={details.accountName || ''} onChange={e => setDetails({ ...details, accountName: e.target.value })} />
                  </div>
                </div>
              )}

              <div className="flex justify-end">
                <Button onClick={handleSubmitWithdrawal} disabled={withdrawing || !amount} className="bg-blue-600 hover:bg-blue-700">
                  {withdrawing ? 'Submitting...' : 'Submit Request'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-white shadow-sm border-0">
          <CardContent className="p-6 text-center">
            <p className="text-sm font-medium text-gray-600">This Month</p>
            <p className="text-3xl font-bold text-blue-600">{currency} {fmt(thisMonthEarnings)}</p>
            <div className="flex items-center justify-center space-x-1 mt-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <span className="text-sm text-gray-500">Earnings credited</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-sm border-0">
          <CardContent className="p-6 text-center">
            <p className="text-sm font-medium text-gray-600">Available Balance</p>
            <p className="text-3xl font-bold text-green-600">{currency} {fmt(summary?.balance)}</p>
            <p className="text-xs text-gray-500 mt-2">After commission</p>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-sm border-0">
          <CardContent className="p-6 text-center">
            <p className="text-sm font-medium text-gray-600">Total Earned</p>
            <p className="text-3xl font-bold text-purple-600">{currency} {fmt(summary?.totalEarned)}</p>
            <p className="text-xs text-gray-500 mt-2">Since joining</p>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-sm border-0">
          <CardContent className="p-6 text-center">
            <p className="text-sm font-medium text-gray-600">Pending Withdrawals</p>
            <p className="text-3xl font-bold text-orange-600">{currency} {fmt(summary?.pendingWithdrawals)}</p>
            <p className="text-xs text-gray-500 mt-2">Awaiting admin approval</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions */}
      <Card className="bg-white shadow-sm border-0">
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          {loadingTx ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-16 bg-gray-100 rounded animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {tx.length === 0 && (
                <div className="text-center text-gray-600">No transactions yet</div>
              )}
              {tx.map((t, i) => (
                <div key={t._id || i} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${t.type === 'CREDIT' ? 'bg-green-100' : 'bg-yellow-100'}`}>
                      <DollarSign className={`h-5 w-5 ${t.type === 'CREDIT' ? 'text-green-600' : 'text-yellow-700'}`} />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{t.description || (t.type === 'CREDIT' ? 'Payment received' : 'Withdrawal')}</p>
                      <p className="text-sm text-gray-500">{new Date(t.createdAt).toLocaleString()}</p>
                      {t.type === 'CREDIT' && typeof t.commission === 'number' && (
                        <p className="text-xs text-gray-500">Commission: {currency} {(t.commission || 0).toLocaleString()}</p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold ${t.type === 'CREDIT' ? 'text-green-700' : 'text-gray-900'}`}>
                      {t.type === 'CREDIT' ? '+' : '-'}{currency} {(t.type === 'CREDIT' ? (t.netAmount ?? t.amount) : t.amount).toLocaleString()}
                    </p>
                    <Badge variant="secondary" className="text-xs mt-1">{t.status}</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
