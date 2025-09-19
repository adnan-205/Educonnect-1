"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Edit, Plus, Play, Trash2, Upload, Video, Clock, FileVideo, Link } from "lucide-react"
import { uploadsApi } from "@/services/api"

export interface DemoVideo {
    id: string
    title: string
    description: string
    videoUrl: string
    thumbnailUrl?: string
    duration: string
    subject: string
    uploadDate: string
    videoType: 'local' | 'external' // New field to distinguish between local and external videos
    localFile?: File // New field to store local file reference
    cloudinaryPublicId?: string // Add this field to store Cloudinary public ID
}

interface DemoVideoSectionProps {
    videos: DemoVideo[]
    onUpdate: (videos: DemoVideo[]) => void
    isEditable?: boolean
}

export function DemoVideoSection({ videos, onUpdate, isEditable = true }: DemoVideoSectionProps) {
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [editingVideo, setEditingVideo] = useState<DemoVideo | null>(null)
    const [activeTab, setActiveTab] = useState<'local' | 'external'>('local')
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        videoUrl: "",
        thumbnailUrl: "",
        duration: "",
        subject: "",
        videoType: 'local' as 'local' | 'external'
    })
    const [localFile, setLocalFile] = useState<File | null>(null)
    const [uploading, setUploading] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        try {
            setUploading(true)
            let videoUrl = formData.videoUrl
            let duration = formData.duration
            let cloudinaryPublicId: string | undefined = undefined

            // If local upload tab, upload file to Cloudinary first
            if (activeTab === 'local') {
                if (!localFile) return
                const up = await uploadsApi.uploadVideo(localFile, 'educonnect/demo-videos')
                videoUrl = up?.data?.url || videoUrl
                duration = (up?.data?.duration ? formatDuration(up.data.duration) : duration)
                cloudinaryPublicId = up?.data?.public_id
            }

            if (editingVideo) {
                const updatedVideos = videos.map(video =>
                    video.id === editingVideo.id
                        ? {
                            ...editingVideo,
                            ...formData,
                            videoUrl,
                            duration,
                            videoType: activeTab,
                            localFile: undefined,
                            cloudinaryPublicId: activeTab === 'local' ? cloudinaryPublicId : undefined,
                        }
                        : video
                )
                onUpdate(updatedVideos)
            } else {
                const newVideo: DemoVideo = {
                    id: `video_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    ...formData,
                    videoUrl,
                    duration,
                    videoType: activeTab,
                    uploadDate: new Date().toISOString().split('T')[0],
                    cloudinaryPublicId: activeTab === 'local' ? cloudinaryPublicId : undefined,
                }
                onUpdate([...videos, newVideo])
            }

            resetForm()
            setIsDialogOpen(false)
        } finally {
            setUploading(false)
        }
    }

    const handleEdit = (video: DemoVideo) => {
        setEditingVideo(video)
        setFormData({
            title: video.title,
            description: video.description,
            videoUrl: video.videoUrl,
            thumbnailUrl: video.thumbnailUrl || "",
            duration: video.duration,
            subject: video.subject,
            videoType: video.videoType
        })
        setLocalFile(video.localFile || null)
        setActiveTab(video.videoType)
        setIsDialogOpen(true)
    }

    const handleDelete = (videoId: string) => {
        const updatedVideos = videos.filter(video => video.id !== videoId)
        onUpdate(updatedVideos)
    }

    const resetForm = () => {
        setFormData({
            title: "",
            description: "",
            videoUrl: "",
            thumbnailUrl: "",
            duration: "",
            subject: "",
            videoType: 'local'
        })
        setLocalFile(null)
        setEditingVideo(null)
        setActiveTab('local')
    }

    const openDialog = () => {
        resetForm()
        setIsDialogOpen(true)
    }

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            // Validate file type
            if (!file.type.startsWith('video/')) {
                alert('Please select a valid video file')
                return
            }

            // Validate file size (max 100MB)
            if (file.size > 100 * 1024 * 1024) {
                alert('Video file size must be less than 100MB')
                return
            }

            setLocalFile(file)

            // Create a preview URL for the video
            const videoUrl = URL.createObjectURL(file)
            setFormData(prev => ({ ...prev, videoUrl }))

            // Try to get video duration
            const video = document.createElement('video')
            video.preload = 'metadata'
            video.onloadedmetadata = () => {
                const duration = Math.round(video.duration)
                const minutes = Math.floor(duration / 60)
                const seconds = duration % 60
                setFormData(prev => ({
                    ...prev,
                    duration: `${minutes}:${seconds.toString().padStart(2, '0')}`
                }))
            }
            video.src = videoUrl
        }
    }

    const formatDuration = (secondsFloat: number) => {
        const total = Math.round(secondsFloat || 0)
        const minutes = Math.floor(total / 60)
        const seconds = total % 60
        return `${minutes}:${seconds.toString().padStart(2, '0')}`
    }

    const handleTabChange = (value: string) => {
        setActiveTab(value as 'local' | 'external')
        if (value === 'local') {
            setFormData(prev => ({ ...prev, videoUrl: '' }))
        } else {
            setLocalFile(null)
        }
    }

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                    <Video className="h-5 w-5" />
                    Demo Videos
                </CardTitle>
                {isEditable && (
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button onClick={openDialog}>
                                <Plus className="h-4 w-4 mr-2" />
                                Add Video
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                            <DialogHeader>
                                <DialogTitle>
                                    {editingVideo ? "Edit Demo Video" : "Add Demo Video"}
                                </DialogTitle>
                            </DialogHeader>

                            <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
                                <TabsList className="grid w-full grid-cols-2">
                                    <TabsTrigger value="local" className="flex items-center gap-2">
                                        <FileVideo className="h-4 w-4" />
                                        Upload Video
                                    </TabsTrigger>
                                    <TabsTrigger value="external" className="flex items-center gap-2">
                                        <Link className="h-4 w-4" />
                                        Video Link
                                    </TabsTrigger>
                                </TabsList>

                                <TabsContent value="local" className="space-y-4">
                                    <form onSubmit={handleSubmit} className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <Label htmlFor="title">Video Title *</Label>
                                                <Input
                                                    id="title"
                                                    value={formData.title}
                                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                                    placeholder="e.g., Calculus Introduction"
                                                    required
                                                />
                                            </div>
                                            <div>
                                                <Label htmlFor="subject">Subject *</Label>
                                                <Input
                                                    id="subject"
                                                    value={formData.subject}
                                                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                                    placeholder="e.g., Mathematics"
                                                    required
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <Label htmlFor="videoFile">Select Video File *</Label>
                                            <div className="mt-2">
                                                <Input
                                                    ref={fileInputRef}
                                                    id="videoFile"
                                                    type="file"
                                                    accept="video/*"
                                                    onChange={handleFileSelect}
                                                    className="hidden"
                                                />
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    onClick={() => fileInputRef.current?.click()}
                                                    className="w-full"
                                                >
                                                    <Upload className="h-4 w-4 mr-2" />
                                                    {localFile ? localFile.name : "Choose Video File"}
                                                </Button>
                                                {localFile && (
                                                    <div className="mt-2 text-sm text-muted-foreground">
                                                        File: {localFile.name} ({(localFile.size / (1024 * 1024)).toFixed(2)} MB)
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <Label htmlFor="duration">Duration</Label>
                                                <Input
                                                    id="duration"
                                                    value={formData.duration}
                                                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                                                    placeholder="Auto-detected"
                                                    readOnly
                                                />
                                            </div>
                                            <div>
                                                <Label htmlFor="thumbnailUrl">Thumbnail URL (Optional)</Label>
                                                <Input
                                                    id="thumbnailUrl"
                                                    value={formData.thumbnailUrl}
                                                    onChange={(e) => setFormData({ ...formData, thumbnailUrl: e.target.value })}
                                                    placeholder="Custom thumbnail image URL"
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <Label htmlFor="description">Description</Label>
                                            <Textarea
                                                id="description"
                                                value={formData.description}
                                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                                rows={3}
                                                placeholder="Brief description of what this video demonstrates..."
                                            />
                                        </div>

                                        <div className="flex justify-end gap-2">
                                            <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                                                Cancel
                                            </Button>
                                            <Button type="submit" disabled={!localFile || uploading}>
                                                {uploading ? "Uploading..." : (editingVideo ? "Update Video" : "Upload Video")}
                                            </Button>
                                        </div>
                                    </form>
                                </TabsContent>

                                <TabsContent value="external" className="space-y-4">
                                    <form onSubmit={handleSubmit} className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <Label htmlFor="title">Video Title *</Label>
                                                <Input
                                                    id="title"
                                                    value={formData.title}
                                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                                    placeholder="e.g., Calculus Introduction"
                                                    required
                                                />
                                            </div>
                                            <div>
                                                <Label htmlFor="subject">Subject *</Label>
                                                <Input
                                                    id="subject"
                                                    value={formData.subject}
                                                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                                    placeholder="e.g., Mathematics"
                                                    required
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <Label htmlFor="videoUrl">Video URL *</Label>
                                                <Input
                                                    id="videoUrl"
                                                    value={formData.videoUrl}
                                                    onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                                                    placeholder="YouTube, Vimeo, or direct video link"
                                                    required
                                                />
                                            </div>
                                            <div>
                                                <Label htmlFor="duration">Duration *</Label>
                                                <Input
                                                    id="duration"
                                                    value={formData.duration}
                                                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                                                    placeholder="e.g., 5:30"
                                                    required
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <Label htmlFor="thumbnailUrl">Thumbnail URL (Optional)</Label>
                                            <Input
                                                id="thumbnailUrl"
                                                value={formData.thumbnailUrl}
                                                onChange={(e) => setFormData({ ...formData, thumbnailUrl: e.target.value })}
                                                placeholder="Custom thumbnail image URL"
                                            />
                                        </div>

                                        <div>
                                            <Label htmlFor="description">Description</Label>
                                            <Textarea
                                                id="description"
                                                value={formData.description}
                                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                                rows={3}
                                                placeholder="Brief description of what this video demonstrates..."
                                            />
                                        </div>

                                        <div className="flex justify-end gap-2">
                                            <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                                                Cancel
                                            </Button>
                                            <Button type="submit">
                                                {editingVideo ? "Update Video" : "Add Video"}
                                            </Button>
                                        </div>
                                    </form>
                                </TabsContent>
                            </Tabs>
                        </DialogContent>
                    </Dialog>
                )}
            </CardHeader>
            <CardContent>
                {videos.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                        <Video className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p className="text-lg font-medium mb-2">No demo videos yet</p>
                        <p className="text-sm">Upload demo videos to showcase your teaching style and expertise</p>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {videos.map((video, index) => (
                            <div key={video.id || `video-${index}`} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                                <div className="flex items-start gap-4">
                                    {/* Video Thumbnail */}
                                    <div className="relative flex-shrink-0">
                                        <div className="w-32 h-20 bg-muted rounded-lg flex items-center justify-center overflow-hidden">
                                            {video.thumbnailUrl ? (
                                                <img
                                                    src={video.thumbnailUrl}
                                                    alt={video.title}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                                                    <Play className="h-8 w-8 text-white" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="absolute bottom-1 right-1 bg-black/70 text-white text-xs px-2 py-1 rounded">
                                            {video.duration}
                                        </div>
                                        {video.videoType === 'local' && (
                                            <div className="absolute top-1 left-1 bg-green-600 text-white text-xs px-2 py-1 rounded">
                                                Local
                                            </div>
                                        )}
                                    </div>

                                    {/* Video Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between mb-2">
                                            <div className="min-w-0 flex-1">
                                                <h3 className="font-semibold text-lg mb-1 line-clamp-1">{video.title}</h3>
                                                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                                                    <Badge variant="outline">{video.subject}</Badge>
                                                    <span>•</span>
                                                    <span className="flex items-center gap-1">
                                                        <Clock className="h-3 w-3" />
                                                        {video.duration}
                                                    </span>
                                                    <span>•</span>
                                                    <span>Uploaded {new Date(video.uploadDate).toLocaleDateString()}</span>
                                                    <span>•</span>
                                                    <Badge variant="secondary" className="text-xs">
                                                        {video.videoType === 'local' ? 'Local File' : 'External Link'}
                                                    </Badge>
                                                </div>
                                                {video.description && (
                                                    <p className="text-sm text-muted-foreground line-clamp-2">
                                                        {video.description}
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        {/* Action Buttons */}
                                        <div className="flex items-center gap-2 mt-3">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => {
                                                    if (video.videoType === 'local' && video.localFile) {
                                                        // For local files, create a blob URL to play
                                                        const blobUrl = URL.createObjectURL(video.localFile)
                                                        window.open(blobUrl, '_blank')
                                                    } else {
                                                        // For external links, open directly
                                                        window.open(video.videoUrl, '_blank')
                                                    }
                                                }}
                                            >
                                                <Play className="h-4 w-4 mr-2" />
                                                Watch
                                            </Button>
                                            {isEditable && (
                                                <>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleEdit(video)}
                                                    >
                                                        <Edit className="h-4 w-4 mr-2" />
                                                        Edit
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleDelete(video.id)}
                                                        className="text-destructive hover:text-destructive"
                                                    >
                                                        <Trash2 className="h-4 w-4 mr-2" />
                                                        Delete
                                                    </Button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
