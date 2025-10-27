"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { adminApi } from "@/services/api"
import { useToast } from "@/hooks/use-toast"

export default function AdminUsersPage() {
  const [role, setRole] = useState<string | null>(null)
  const [tab, setTab] = useState<string>("users")

  // Users state
  const [users, setUsers] = useState<any[]>([])
  const [usersLoading, setUsersLoading] = useState(false)
  const [usersPage, setUsersPage] = useState(1)
  const [usersTotalPages, setUsersTotalPages] = useState(1)
  const [q, setQ] = useState("")
  const [filterRole, setFilterRole] = useState<string>("all")
  const [filterOnboarded, setFilterOnboarded] = useState<string>("any")

  // Activities state
  const [activities, setActivities] = useState<any[]>([])
  const [activitiesLoading, setActivitiesLoading] = useState(false)
  const [actPage, setActPage] = useState(1)
  const [actTotalPages, setActTotalPages] = useState(1)
  const [actUserId, setActUserId] = useState<string>("all")
  const [actAction, setActAction] = useState<string>("")
  const [actTargetType, setActTargetType] = useState<string>("")

  const { toast } = useToast()

  // Guard: require admin role
  useEffect(() => {
    if (typeof window !== "undefined") {
      setRole(localStorage.getItem("role"))
    }
  }, [])

  const usersOptions = useMemo(() => users.map(u => ({ id: u._id || u.id, label: `${u.name || "Unnamed"} <${u.email}>` })), [users])

  useEffect(() => {
    if (role !== "admin") return
    const loadUsers = async () => {
      try {
        setUsersLoading(true)
        const res = await adminApi.listUsers({
          page: usersPage,
          q,
          role: filterRole !== 'all' ? (filterRole as any) : undefined,
          isOnboarded: filterOnboarded === 'true' || filterOnboarded === 'false' ? (filterOnboarded as any) : undefined,
        })
        const data = res || {}
        setUsers(data.data || [])
        setUsersTotalPages(data.totalPages || 1)
      } catch (e: any) {
        toast({ title: "Failed to load users", description: e?.message || "" })
      } finally {
        setUsersLoading(false)
      }
    }
    loadUsers()
  }, [role, usersPage, q, filterRole, filterOnboarded, toast])

  useEffect(() => {
    if (role !== "admin") return
    const loadActivities = async () => {
      try {
        setActivitiesLoading(true)
        const res = await adminApi.listActivities({
          page: actPage,
          userId: actUserId !== 'all' ? actUserId : undefined,
          action: actAction || undefined,
          targetType: actTargetType || undefined,
        })
        const data = res || {}
        setActivities(data.data || [])
        setActTotalPages(data.totalPages || 1)
      } catch (e: any) {
        toast({ title: "Failed to load activities", description: e?.message || "" })
      } finally {
        setActivitiesLoading(false)
      }
    }
    loadActivities()
  }, [role, actPage, actUserId, actAction, actTargetType, toast])

  if (role !== "admin") {
    return (
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Forbidden</h1>
        <p className="text-gray-600">You must be an admin to view this page.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Admin · User Management</h1>
        <p className="text-gray-600 mt-1">Manage users and view activity across the platform.</p>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          <Card className="bg-white shadow-sm border-0">
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <Input placeholder="Search name or email" value={q} onChange={(e) => { setUsersPage(1); setQ(e.target.value) }} />
                <Select value={filterRole} onValueChange={(v) => { setUsersPage(1); setFilterRole(v) }}>
                  <SelectTrigger><SelectValue placeholder="All roles" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All roles</SelectItem>
                    <SelectItem value="student">Student</SelectItem>
                    <SelectItem value="teacher">Teacher</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterOnboarded} onValueChange={(v) => { setUsersPage(1); setFilterOnboarded(v) }}>
                  <SelectTrigger><SelectValue placeholder="Onboarding status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Any onboarding</SelectItem>
                    <SelectItem value="true">Onboarded</SelectItem>
                    <SelectItem value="false">Not onboarded</SelectItem>
                  </SelectContent>
                </Select>
                <div className="flex gap-2">
                  <Button variant="secondary" onClick={() => { setQ(""); setFilterRole("all"); setFilterOnboarded("any"); setUsersPage(1) }}>Reset</Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-sm border-0">
            <CardHeader>
              <CardTitle>Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Onboarded</TableHead>
                      <TableHead>Created</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {usersLoading ? (
                      <TableRow><TableCell colSpan={5} className="text-center text-gray-500">Loading...</TableCell></TableRow>
                    ) : users.length === 0 ? (
                      <TableRow><TableCell colSpan={5} className="text-center text-gray-500">No users</TableCell></TableRow>
                    ) : (
                      users.map((u) => (
                        <TableRow key={u._id || u.id} className="cursor-pointer hover:bg-gray-50" onClick={() => { setTab("activity"); setActUserId(u._id || u.id); setActPage(1) }}>
                          <TableCell className="font-medium">{u.name}</TableCell>
                          <TableCell>{u.email}</TableCell>
                          <TableCell className="capitalize">{u.role}</TableCell>
                          <TableCell>{u.isOnboarded ? "Yes" : "No"}</TableCell>
                          <TableCell>{u.createdAt ? new Date(u.createdAt).toLocaleString() : ""}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
              <div className="flex items-center justify-end gap-2 mt-4">
                <Button variant="outline" disabled={usersPage <= 1} onClick={() => setUsersPage((p) => Math.max(1, p - 1))}>Previous</Button>
                <div className="text-sm text-gray-600">Page {usersPage} / {usersTotalPages}</div>
                <Button variant="outline" disabled={usersPage >= usersTotalPages} onClick={() => setUsersPage((p) => p + 1)}>Next</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <Card className="bg-white shadow-sm border-0">
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <Select value={actUserId} onValueChange={(v) => { setActPage(1); setActUserId(v) }}>
                  <SelectTrigger><SelectValue placeholder="All users" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All users</SelectItem>
                    {usersOptions.map((o) => (
                      <SelectItem key={o.id} value={o.id}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input placeholder="Action (e.g., auth.login)" value={actAction} onChange={(e) => { setActPage(1); setActAction(e.target.value) }} />
                <Input placeholder="Target type (e.g., Booking)" value={actTargetType} onChange={(e) => { setActPage(1); setActTargetType(e.target.value) }} />
                <div className="flex gap-2">
                  <Button variant="secondary" onClick={() => { setActUserId("all"); setActAction(""); setActTargetType(""); setActPage(1) }}>Reset</Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-sm border-0">
            <CardHeader>
              <CardTitle>Activity Feed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Time</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Target</TableHead>
                      <TableHead>Details</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activitiesLoading ? (
                      <TableRow><TableCell colSpan={5} className="text-center text-gray-500">Loading...</TableCell></TableRow>
                    ) : activities.length === 0 ? (
                      <TableRow><TableCell colSpan={5} className="text-center text-gray-500">No activity</TableCell></TableRow>
                    ) : (
                      activities.map((a) => (
                        <TableRow key={a._id}>
                          <TableCell>{a.createdAt ? new Date(a.createdAt).toLocaleString() : ""}</TableCell>
                          <TableCell>{a.user ? `${a.user.name} <${a.user.email}>` : "-"}</TableCell>
                          <TableCell>{a.action}</TableCell>
                          <TableCell>{a.targetType || "-"}</TableCell>
                          <TableCell>
                            <pre className="text-xs whitespace-pre-wrap text-gray-700 bg-gray-50 p-2 rounded">{a.metadata ? JSON.stringify(a.metadata, null, 2) : "-"}</pre>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
              <div className="flex items-center justify-end gap-2 mt-4">
                <Button variant="outline" disabled={actPage <= 1} onClick={() => setActPage((p) => Math.max(1, p - 1))}>Previous</Button>
                <div className="text-sm text-gray-600">Page {actPage} / {actTotalPages}</div>
                <Button variant="outline" disabled={actPage >= actTotalPages} onClick={() => setActPage((p) => p + 1)}>Next</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
