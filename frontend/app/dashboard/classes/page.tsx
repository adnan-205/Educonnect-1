"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { adminApi } from "@/services/api"
import { useToast } from "@/hooks/use-toast"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Line, LineChart, XAxis, YAxis, CartesianGrid, Legend, Tooltip, Area, AreaChart } from "recharts"

export default function AdminClassAnalyticsPage() {
  const { toast } = useToast()
  const [role, setRole] = useState<string | null>(null)

  // Filters
  const [from, setFrom] = useState<string>(defaultFrom())
  const [to, setTo] = useState<string>(defaultTo())
  const [status, setStatus] = useState<string>("any")
  const [teacherId, setTeacherId] = useState<string>("all")

  // Data
  const [loading, setLoading] = useState(false)
  const [summary, setSummary] = useState<any>(null)
  const [series, setSeries] = useState<any[]>([])
  const [topTeachers, setTopTeachers] = useState<any[]>([])
  const [revenue, setRevenue] = useState<any>(null)

  // Teachers list for filter
  const [teachers, setTeachers] = useState<Array<{ id: string; name: string; email: string }>>([])

  useEffect(() => {
    if (typeof window !== "undefined") setRole(localStorage.getItem("role"))
  }, [])

  useEffect(() => {
    if (role !== "admin") return
    const loadTeachers = async () => {
      try {
        const res = await adminApi.listUsers({ page: 1, limit: 100, role: 'teacher' as any })
        const arr = (res?.data || []).map((u: any) => ({ id: u._id || u.id, name: u.name, email: u.email }))
        setTeachers(arr)
      } catch (e: any) {
        // non-fatal
      }
    }
    loadTeachers()
  }, [role])

  useEffect(() => {
    if (role !== "admin") return
    const load = async () => {
      try {
        setLoading(true)
        const params: any = {}
        if (from) params.from = from
        if (to) params.to = to
        if (status !== 'any') params.status = status
        if (teacherId !== 'all') params.teacherId = teacherId
        const res = await adminApi.getClassAnalytics(params)
        const data = res?.data || {}
        setSummary(data.summary || null)
        setSeries(data.timeseries || [])
        setTopTeachers(data.topTeachers || [])
        setRevenue(data.revenue || null)
      } catch (e: any) {
        toast({ title: 'Failed to load analytics', description: e?.message || '' })
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [role, from, to, status, teacherId, toast])

  if (role !== "admin") {
    return (
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Forbidden</h1>
        <p className="text-gray-600">You must be an admin to view this page.</p>
      </div>
    )
  }

  const chartConfig = {
    pending: { label: 'Pending', color: 'hsl(48, 95%, 53%)' },
    accepted: { label: 'Accepted', color: 'hsl(217, 91%, 60%)' },
    rejected: { label: 'Rejected', color: 'hsl(0, 84%, 60%)' },
    completed: { label: 'Completed', color: 'hsl(142, 71%, 45%)' },
    total: { label: 'Total', color: 'hsl(271, 81%, 56%)' },
  } as const

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Admin · Class Analytics</h1>
        <p className="text-gray-600 mt-1">Track classes volume, conversions, attendance, and revenue.</p>
      </div>

      {/* Filters */}
      <Card className="bg-white shadow-sm border-0">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <div>
              <label className="text-xs text-gray-500">From</label>
              <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-gray-500">To</label>
              <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-gray-500">Status</label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger><SelectValue placeholder="Any status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="accepted">Accepted</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2">
              <label className="text-xs text-gray-500">Teacher</label>
              <Select value={teacherId} onValueChange={setTeacherId}>
                <SelectTrigger><SelectValue placeholder="All teachers" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All teachers</SelectItem>
                  {teachers.map(t => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name} <span className="text-gray-500 text-xs">&lt;{t.email}&gt;</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="mt-3 flex gap-2">
            <Button variant="secondary" onClick={() => { setFrom(defaultFrom()); setTo(defaultTo()); setStatus('any'); setTeacherId('all') }}>Reset</Button>
          </div>
        </CardContent>
      </Card>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <SummaryCard title="Total Classes" value={loading ? '...' : summary?.total ?? 0} />
        <SummaryCard title="Accepted" value={loading ? '...' : summary?.accepted ?? 0} />
        <SummaryCard title="Completed" value={loading ? '...' : summary?.completed ?? 0} />
        <SummaryCard title="Attendance Rate" value={loading ? '...' : `${summary?.attendanceRate ?? 0}%`} />
      </div>

      {/* Time-series chart */}
      <Card className="bg-white shadow-sm border-0">
        <CardHeader>
          <CardTitle>Classes over time</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig}>
            <AreaChart data={series} margin={{ left: 10, right: 10, top: 10 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
              <Tooltip content={<ChartTooltipContent />} />
              <Legend />
              <Area type="monotone" dataKey="pending" stroke="#f59e0b" fill="#f59e0b22" name="Pending" />
              <Area type="monotone" dataKey="accepted" stroke="#3b82f6" fill="#3b82f622" name="Accepted" />
              <Area type="monotone" dataKey="rejected" stroke="#ef4444" fill="#ef444422" name="Rejected" />
              <Area type="monotone" dataKey="completed" stroke="#22c55e" fill="#22c55e22" name="Completed" />
            </AreaChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Revenue and conversion */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <SummaryCard title="Pending" value={loading ? '...' : summary?.pending ?? 0} />
        <SummaryCard title="Rejected" value={loading ? '...' : summary?.rejected ?? 0} />
        <SummaryCard title="Conversion Rate" value={loading ? '...' : `${summary?.conversionRate ?? 0}%`} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-white shadow-sm border-0">
          <CardHeader>
            <CardTitle>Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{loading ? '...' : formatCurrency(revenue?.amount || 0)}</div>
            <div className="text-sm text-gray-500 mt-1">Successful payments: {loading ? '...' : (revenue?.count || 0)}</div>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-sm border-0">
          <CardHeader>
            <CardTitle>Top Teachers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Teacher</TableHead>
                    <TableHead>Bookings</TableHead>
                    <TableHead>Completed</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow><TableCell colSpan={3} className="text-center text-gray-500">Loading...</TableCell></TableRow>
                  ) : (topTeachers || []).length === 0 ? (
                    <TableRow><TableCell colSpan={3} className="text-center text-gray-500">No data</TableCell></TableRow>
                  ) : (
                    topTeachers.map((t) => (
                      <TableRow key={String(t.teacherId)}>
                        <TableCell>{t.name || 'Unknown'} <span className="text-gray-500 text-xs">{t.email}</span></TableCell>
                        <TableCell>{t.bookings}</TableCell>
                        <TableCell>{t.completed}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function defaultTo() {
  const d = new Date()
  return d.toISOString().slice(0, 10)
}
function defaultFrom() {
  const d = new Date();
  d.setDate(d.getDate() - 30)
  return d.toISOString().slice(0, 10)
}

function SummaryCard({ title, value }: { title: string; value: string | number }) {
  return (
    <Card className="bg-white shadow-sm border-0">
      <CardHeader>
        <CardTitle className="text-sm text-gray-500">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold">{value}</div>
      </CardContent>
    </Card>
  )
}

function formatCurrency(n: number) {
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'BDT', maximumFractionDigits: 0 }).format(n)
  } catch {
    return `${n.toLocaleString()} BDT`
  }
}
