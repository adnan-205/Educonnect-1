"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useUser } from "@clerk/nextjs"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { walletAdminApi, api } from "@/services/api"
import { useToast } from "@/hooks/use-toast"

export default function AdminTransactionsPage() {
  const router = useRouter()
  const { isLoaded, isSignedIn, user } = useUser()
  const { toast } = useToast()

  const [pending, setPending] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [rejectOpen, setRejectOpen] = useState(false)
  const [rejectId, setRejectId] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState("")
  const [submitting, setSubmitting] = useState(false)

  // Admin guard + token sync
  useEffect(() => {
    const init = async () => {
      if (!isLoaded) return
      if (!isSignedIn) {
        router.replace("/sign-in")
        return
      }
      // ensure backend token
      let token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
      const email = user?.primaryEmailAddress?.emailAddress
      if (!token && email) {
        try {
          const name = user.fullName || undefined
          const res = await api.post('/auth/clerk-sync', { email, name })
          const { token: t, user: backendUser } = res.data || {}
          if (t) localStorage.setItem('token', t)
          if (backendUser?.role) localStorage.setItem('role', backendUser.role)
        } catch {}
      }
      // admin gate by role
      const role = typeof window !== 'undefined' ? localStorage.getItem('role') : null
      if (role !== 'admin') {
        toast({ title: 'Access denied', description: 'Admin access required', variant: 'destructive' })
        router.replace('/dashboard-2')
        return
      }
      await load()
    }
    init()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, isSignedIn, user?.id])

  const load = async () => {
    try {
      setLoading(true)
      const res = await walletAdminApi.getPending()
      setPending(res?.data || [])
    } catch (e: any) {
      toast({ title: 'Error', description: e?.response?.data?.message || 'Failed to load pending withdrawals', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (id: string) => {
    try {
      setSubmitting(true)
      await walletAdminApi.approve(id)
      toast({ title: 'Approved', description: 'Withdrawal approved.' })
      await load()
    } catch (e: any) {
      toast({ title: 'Error', description: e?.response?.data?.message || 'Failed to approve', variant: 'destructive' })
    } finally {
      setSubmitting(false)
    }
  }

  const openReject = (id: string) => {
    setRejectId(id)
    setRejectReason("")
    setRejectOpen(true)
  }

  const handleReject = async () => {
    if (!rejectId) return
    try {
      setSubmitting(true)
      await walletAdminApi.reject(rejectId, rejectReason || 'Not specified')
      toast({ title: 'Rejected', description: 'Withdrawal rejected.' })
      setRejectOpen(false)
      await load()
    } catch (e: any) {
      toast({ title: 'Error', description: e?.response?.data?.message || 'Failed to reject', variant: 'destructive' })
    } finally {
      setSubmitting(false)
    }
  }

  const fmt = (n: number) => (n ?? 0).toLocaleString()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin · Pending Withdrawals</h1>
          <p className="text-gray-600 mt-2">Review, approve or reject teacher withdrawal requests.</p>
        </div>
        <Button variant="outline" onClick={load}>Refresh</Button>
      </div>

      <Card className="bg-white shadow-sm border-0">
        <CardHeader>
          <CardTitle>Pending Requests</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-14 bg-gray-100 rounded animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Teacher</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Details</TableHead>
                    <TableHead>Requested At</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pending.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-gray-500">No pending withdrawals</TableCell>
                    </TableRow>
                  )}
                  {pending.map((p: any) => (
                    <TableRow key={p._id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium text-gray-900">{p.teacher?.name || p.teacherName || 'Teacher'}</span>
                          <span className="text-xs text-gray-500">{p.teacher?.email || p.teacherEmail || ''}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-semibold">{p.currency || 'BDT'} {fmt(p.amount)}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-xs">{p.withdrawalMethod || 'N/A'}</Badge>
                      </TableCell>
                      <TableCell className="max-w-xs">
                        <div className="text-xs text-gray-600 break-words">
                          {p.withdrawalDetails ? JSON.stringify(p.withdrawalDetails) : '—'}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">{new Date(p.createdAt).toLocaleString()}</TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button size="sm" disabled={submitting} onClick={() => handleApprove(p._id)} className="bg-green-600 hover:bg-green-700">Approve</Button>
                        <Button size="sm" variant="outline" disabled={submitting} onClick={() => openReject(p._id)} className="text-red-600 border-red-600 hover:bg-red-50">Reject</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Reject Withdrawal</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Label>Reason</Label>
            <Input value={rejectReason} onChange={e => setRejectReason(e.target.value)} placeholder="Provide clear reason" />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setRejectOpen(false)}>Cancel</Button>
              <Button className="bg-red-600 hover:bg-red-700" onClick={handleReject} disabled={submitting || !rejectReason}>Reject</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
