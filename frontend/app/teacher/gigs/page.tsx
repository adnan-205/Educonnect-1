"use client"

import { useEffect, useState, useMemo } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useUser } from "@clerk/nextjs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { gigsApi } from "@/services/api"
import { Loader2, Plus, Pencil, Trash2, Search } from "lucide-react"

interface Gig {
  _id: string
  title: string
  description: string
  category: string
  price: number
  duration: number
  createdAt: string
  teacher: {
    _id: string
    name: string
    email: string
  }
}

export default function TeacherGigsListPage() {
  const router = useRouter()
  const { isLoaded, isSignedIn } = useUser()

  const [teacherId, setTeacherId] = useState<string | null>(null)
  const [allGigs, setAllGigs] = useState<Gig[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [search, setSearch] = useState("")

  useEffect(() => {
    if (!isLoaded) return
    if (!isSignedIn) {
      router.replace("/sign-in")
      return
    }
    if (typeof window !== "undefined") {
      try {
        const u = localStorage.getItem("user")
        if (u) {
          const parsed = JSON.parse(u)
          setTeacherId(parsed?._id || null)
        }
      } catch {}
    }
  }, [isLoaded, isSignedIn, router])

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        setError("")
        const res = await gigsApi.getAllGigs()
        const gigs = res?.data || []
        setAllGigs(gigs)
      } catch (e: any) {
        setError(e?.response?.data?.message || "Failed to load gigs")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const myGigs = useMemo(() => {
    const list = allGigs.filter((g) => g.teacher?._id === teacherId)
    if (!search.trim()) return list
    const q = search.toLowerCase()
    return list.filter((g) =>
      g.title.toLowerCase().includes(q) ||
      g.category.toLowerCase().includes(q) ||
      g.description.toLowerCase().includes(q)
    )
  }, [allGigs, teacherId, search])

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this gig? This cannot be undone.")) return
    try {
      setLoading(true)
      await gigsApi.deleteGig(id)
      // remove locally
      setAllGigs((prev) => prev.filter((g) => g._id !== id))
    } catch (e: any) {
      alert(e?.response?.data?.message || "Failed to delete gig")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Manage My Gigs</h1>
        <Link href="/teacher/gigs/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" /> New Gig
          </Button>
        </Link>
      </div>

      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search my gigs..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin mr-2" /> Loading...
        </div>
      ) : myGigs.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No gigs found</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Create your first gig to start receiving bookings.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {myGigs.map((gig) => (
            <Card key={gig._id} className="overflow-hidden">
              <CardHeader>
                <CardTitle className="text-base">{gig.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground mb-2">{gig.category}</div>
                <div className="text-sm mb-3 line-clamp-2">{gig.description}</div>
                <div className="flex items-center justify-between mb-4 text-sm">
                  <span>${gig.price}/hr</span>
                  <span>{gig.duration} min</span>
                </div>
                <div className="flex items-center justify-between">
                  <Link href={`/teacher/gigs/${gig._id}/edit`}>
                    <Button variant="outline" size="sm">
                      <Pencil className="h-4 w-4 mr-2" /> Edit
                    </Button>
                  </Link>
                  <Button variant="destructive" size="sm" onClick={() => handleDelete(gig._id)}>
                    <Trash2 className="h-4 w-4 mr-2" /> Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
