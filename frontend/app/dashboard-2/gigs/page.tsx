"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { gigsApi, usersApi } from "@/services/api"
import { useToast } from "@/hooks/use-toast"
import { Plus, Edit, Trash2, Star, DollarSign, Clock, Users } from "lucide-react"
import Link from "next/link"
import { getGigThumb } from "@/lib/images"

export default function GigsPage() {
    const [gigs, setGigs] = useState<any[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")
    const { toast } = useToast()

    useEffect(() => {
        loadGigs()
    }, [])

    const loadGigs = async () => {
        try {
            setLoading(true)
            setError("")
            // Get current user id from localStorage (set by AuthContext on login)
            const userStr = typeof window !== "undefined" ? localStorage.getItem("user") : null
            const parsed = userStr ? JSON.parse(userStr) : null
            const userId = parsed?.id || parsed?._id || null

            if (!userId) {
                setError("Not authenticated")
                setGigs([])
                return
            }

            // Fetch gigs for current teacher
            const res = await usersApi.getUserGigs(userId)
            setGigs(res?.data || [])
        } catch (e: any) {
            setError(e?.response?.data?.message || "Failed to load gigs")
        } finally {
            setLoading(false)
        }
    }

    const handleDeleteGig = async (gigId: string) => {
        if (!confirm("Are you sure you want to delete this gig?")) return
        
        try {
            await gigsApi.deleteGig(gigId)
            toast({
                title: "Success",
                description: "Gig deleted successfully"
            })
            loadGigs()
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to delete gig",
                variant: "destructive"
            })
        }
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case "active":
                return "bg-green-100 text-green-800"
            case "paused":
                return "bg-yellow-100 text-yellow-800"
            case "draft":
                return "bg-gray-100 text-gray-800"
            default:
                return "bg-blue-100 text-blue-800"
        }
    }

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="animate-pulse">
                    <div className="h-8 bg-gray-200 rounded w-48 mb-4"></div>
                    <div className="space-y-4">
                        {Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
                        ))}
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">My Gigs</h1>
                    <p className="text-gray-600 mt-2">Manage your teaching services and offerings.</p>
                </div>
                <Link href="/dashboard-2/gigs/create">
                    <Button className="bg-blue-600 hover:bg-blue-700">
                        <Plus className="h-4 w-4 mr-2" />
                        Create New Gig
                    </Button>
                </Link>
            </div>

            {error && (
                <div className="text-center text-red-600 p-4 bg-red-50 rounded-lg">
                    {error}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {gigs.length === 0 ? (
                    <div className="col-span-full">
                        <Card className="bg-white shadow-sm border-0">
                            <CardContent className="p-12 text-center">
                                <Star className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                                <h3 className="text-lg font-medium text-gray-900 mb-2">No gigs created yet</h3>
                                <p className="text-gray-500 mb-4">Create your first gig to start teaching students.</p>
                                <Link href="/dashboard-2/gigs/create">
                                    <Button className="bg-blue-600 hover:bg-blue-700">
                                        <Plus className="h-4 w-4 mr-2" />
                                        Create Your First Gig
                                    </Button>
                                </Link>
                            </CardContent>
                        </Card>
                    </div>
                ) : (
                    gigs.map((gig) => (
                        <Card key={gig._id} className="bg-white shadow-sm border-0 hover:shadow-md transition-shadow">
                            <CardHeader className="pb-3">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <CardTitle className="text-lg mb-2">{gig.title}</CardTitle>
                                        <Badge className={getStatusColor(gig.status || "active")}>
                                            {gig.status || "active"}
                                        </Badge>
                                    </div>
                                    <div className="flex gap-1">
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => {
                                                // Navigate to edit gig page (dashboard-2 route)
                                                window.location.href = `/dashboard-2/gigs/${gig._id}/edit`
                                            }}
                                        >
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => handleDeleteGig(gig._id)}
                                            className="text-red-600 hover:text-red-700"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-0">
                                <div className="mb-3">
                                    <img src={getGigThumb(gig.thumbnailUrl, 640, 160)} alt={`${gig.title} thumbnail`} className="w-full h-40 object-cover rounded-md border" />
                                </div>
                                <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                                    {gig.description}
                                </p>
                                
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between text-sm">
                                        <div className="flex items-center gap-1 text-gray-600">
                                            <DollarSign className="h-4 w-4" />
                                            <span>Price</span>
                                        </div>
                                        <span className="font-semibold">${gig.price}/hr</span>
                                    </div>
                                    
                                    <div className="flex items-center justify-between text-sm">
                                        <div className="flex items-center gap-1 text-gray-600">
                                            <Clock className="h-4 w-4" />
                                            <span>Duration</span>
                                        </div>
                                        <span className="font-semibold">{gig.duration} min</span>
                                    </div>
                                    
                                    <div className="flex items-center justify-between text-sm">
                                        <div className="flex items-center gap-1 text-gray-600">
                                            <Users className="h-4 w-4" />
                                            <span>Category</span>
                                        </div>
                                        <span className="font-semibold">{gig.category}</span>
                                    </div>
                                </div>

                                <div className="mt-4 pt-4 border-t border-gray-100">
                                    <div className="flex items-center justify-between text-sm text-gray-500">
                                        <span>Created {new Date(gig.createdAt).toLocaleDateString()}</span>
                                        <Link 
                                            href={`/book/${gig._id}`}
                                            className="text-blue-600 hover:text-blue-700 font-medium"
                                        >
                                            View Details
                                        </Link>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    )
}
