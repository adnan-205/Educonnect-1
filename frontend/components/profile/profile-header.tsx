"use client"

import { useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Edit, Camera, MapPin, Mail, Phone, Globe, Star, Users, Clock, Award } from "lucide-react"
import { UserProfile } from "@/lib/types/profile"
import { uploadsApi, usersApi } from "@/services/api"

interface ProfileHeaderProps {
  profile: UserProfile
  onUpdate: (profile: Partial<UserProfile>) => void
  isEditable?: boolean
}

export function ProfileHeader({ profile, onUpdate, isEditable = true }: ProfileHeaderProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    name: profile.name,
    headline: profile.headline,
    location: profile.location || "",
    bio: profile.bio,
    phone: profile.phone || "",
    subjects: profile.subjects || [],
    languages: profile.languages || [],
    hourlyRate: profile.hourlyRate || 0,
    availability: profile.availability || "",
    timezone: profile.timezone || ""
  })

  const avatarInputRef = useRef<HTMLInputElement>(null)
  const coverInputRef = useRef<HTMLInputElement>(null)

  const handleAvatarSelected = async (file: File) => {
    try {
      const up = await uploadsApi.uploadImage(file, 'educonnect/avatars')
      const url = up?.data?.url
      if (url) {
        onUpdate({ avatar: url })
        try { await usersApi.updateMe({ avatar: url }) } catch {}
      }
    } catch (e) {
      // swallow UI errors for now
    }
  }

  const handleCoverSelected = async (file: File) => {
    try {
      const up = await uploadsApi.uploadImage(file, 'educonnect/covers')
      const url = up?.data?.url
      if (url) {
        onUpdate({ coverImage: url })
        try { await usersApi.updateMe({ coverImage: url }) } catch {}
      }
    } catch (e) {
      // swallow UI errors for now
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onUpdate(formData)
    setIsDialogOpen(false)
  }

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase()
  }

  return (
    <Card className="overflow-hidden">
      {/* Cover Image */}
      <div className="h-32 bg-gradient-to-r from-blue-500 to-purple-600 relative">
        {isEditable && (
          <>
            <input
              ref={coverInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) handleCoverSelected(f)
              }}
            />
            <Button
              variant="secondary"
              size="sm"
              className="absolute top-4 right-4"
              onClick={() => coverInputRef.current?.click()}
            >
              <Camera className="h-4 w-4 mr-2" />
              Edit Cover
            </Button>
          </>
        )}
      </div>

      <CardContent className="relative pt-0">
        {/* Profile Picture and Info */}
        <div className="flex flex-col items-center -mt-16 relative z-10">
          <div className="relative mb-4">
            <Avatar className="w-32 h-32 border-4 border-background">
              <AvatarImage src={profile.avatar} alt={profile.name} />
              <AvatarFallback className="text-2xl">
                {getInitials(profile.name)}
              </AvatarFallback>
            </Avatar>
            {isEditable && (
              <>
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0]
                    if (f) handleAvatarSelected(f)
                  }}
                />
                <Button
                  variant="secondary"
                  size="sm"
                  className="absolute bottom-0 right-0 rounded-full p-2"
                  onClick={() => avatarInputRef.current?.click()}
                >
                  <Camera className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>

          {/* Profile Info - Centered below avatar */}
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold mb-2">{profile.name}</h1>
            <p className="text-xl text-muted-foreground mb-3">{profile.headline}</p>
            
            {/* User Type Badge */}
            <Badge variant={profile.userType === 'teacher' ? 'default' : 'secondary'} className="capitalize mb-4">
              {profile.userType}
            </Badge>
          </div>

          {/* Contact Info and Edit Button */}
          <div className="w-full">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
              <div className="flex flex-col sm:flex-row items-center gap-4 text-sm text-muted-foreground">
                {profile.location && (
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {profile.location}
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <Mail className="h-4 w-4" />
                  {profile.email}
                </div>
                {profile.phone && (
                  <div className="flex items-center gap-1">
                    <Phone className="h-4 w-4" />
                    {profile.phone}
                  </div>
                )}
              </div>

              {isEditable && (
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline">
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Profile
                    </Button>
                  </DialogTrigger>

                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Edit Profile</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="name">Full Name</Label>
                          <Input
                            id="name"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          />
                        </div>
                        <div>
                          <Label htmlFor="headline">Professional Headline</Label>
                          <Input
                            id="headline"
                            value={formData.headline}
                            onChange={(e) => setFormData({ ...formData, headline: e.target.value })}
                            placeholder="e.g. Mathematics Teacher & Tutor"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="location">Location</Label>
                          <Input
                            id="location"
                            value={formData.location}
                            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                          />
                        </div>
                        <div>
                          <Label htmlFor="phone">Phone</Label>
                          <Input
                            id="phone"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="bio">Bio</Label>
                        <Textarea
                          id="bio"
                          value={formData.bio}
                          onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                          rows={4}
                        />
                      </div>

                      {profile.userType === 'teacher' && (
                        <>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="hourlyRate">Hourly Rate ($)</Label>
                              <Input
                                id="hourlyRate"
                                type="number"
                                value={formData.hourlyRate}
                                onChange={(e) => setFormData({ ...formData, hourlyRate: parseInt(e.target.value) || 0 })}
                              />
                            </div>
                            <div>
                              <Label htmlFor="timezone">Timezone</Label>
                              <Input
                                id="timezone"
                                value={formData.timezone}
                                onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                              />
                            </div>
                          </div>

                          <div>
                            <Label htmlFor="availability">Availability</Label>
                            <Input
                              id="availability"
                              value={formData.availability}
                              onChange={(e) => setFormData({ ...formData, availability: e.target.value })}
                              placeholder="e.g. Monday-Friday, 9 AM - 6 PM"
                            />
                          </div>
                        </>
                      )}

                      <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button type="submit">Save Changes</Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              )}
            </div>

            {/* Bio */}
            <p className="mt-4 text-sm leading-relaxed">{profile.bio}</p>

            {/* Skills and Languages */}
            <div className="flex flex-wrap gap-2 mt-4">
              {profile.subjects?.map((subject, index) => (
                <Badge key={index} variant="outline">
                  {subject}
                </Badge>
              ))}
              {profile.languages?.map((language, index) => (
                <Badge key={index} variant="secondary">
                  <Globe className="h-3 w-3 mr-1" />
                  {language}
                </Badge>
              ))}
            </div>

            {/* Teacher Stats */}
            {profile.userType === 'teacher' && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 p-4 bg-muted/50 rounded-lg">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground">
                    <Star className="h-4 w-4" />
                    Rating
                  </div>
                  <div className="font-semibold">
                    {profile.rating && profile.rating > 0 ? `${Number(profile.rating).toFixed(1)}` : '0'}/5 ({profile.reviews || 0})
                  </div>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground">
                    <Users className="h-4 w-4" />
                    Students
                  </div>
                  <div className="font-semibold">{profile.totalStudents || 0}</div>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    Hours
                  </div>
                  <div className="font-semibold">{profile.totalHours || 0}</div>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground">
                    <Award className="h-4 w-4" />
                    Rate
                  </div>
                  <div className="font-semibold">${profile.hourlyRate || 0}/hr</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
