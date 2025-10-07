"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Plus, Edit, Trash2, Briefcase, Calendar, MapPin } from "lucide-react"
import { Experience } from "@/lib/types/profile"

interface ExperienceSectionProps {
  experiences: Experience[]
  onUpdate: (experiences: Experience[]) => void
  isEditable?: boolean
}

export function ExperienceSection({ experiences, onUpdate, isEditable = true }: ExperienceSectionProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingExperience, setEditingExperience] = useState<Experience | null>(null)
  const [formData, setFormData] = useState<Partial<Experience>>({
    title: "",
    company: "",
    location: "",
    startDate: "",
    endDate: "",
    current: false,
    description: "",
    skills: []
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.title || !formData.company || !formData.startDate) return

    const newExperience: Experience = {
      id: editingExperience?.id || `exp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title: formData.title!,
      company: formData.company!,
      location: formData.location || "",
      startDate: formData.startDate!,
      endDate: formData.current ? undefined : formData.endDate,
      current: formData.current || false,
      description: formData.description || "",
      skills: formData.skills || []
    }

    let updatedExperiences
    if (editingExperience) {
      updatedExperiences = experiences.map(exp => 
        exp.id === editingExperience.id ? newExperience : exp
      )
    } else {
      updatedExperiences = [...experiences, newExperience]
    }

    onUpdate(updatedExperiences)
    resetForm()
  }

  const handleDelete = (id: string) => {
    const updatedExperiences = experiences.filter(exp => exp.id !== id)
    onUpdate(updatedExperiences)
  }

  const handleEdit = (experience: Experience) => {
    setEditingExperience(experience)
    setFormData({
      title: experience.title,
      company: experience.company,
      location: experience.location,
      startDate: experience.startDate,
      endDate: experience.endDate,
      current: experience.current,
      description: experience.description,
      skills: experience.skills
    })
    setIsDialogOpen(true)
  }

  const resetForm = () => {
    setFormData({
      title: "",
      company: "",
      location: "",
      startDate: "",
      endDate: "",
      current: false,
      description: "",
      skills: []
    })
    setEditingExperience(null)
    setIsDialogOpen(false)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' })
  }

  const getDuration = (startDate: string, endDate?: string, current?: boolean) => {
    const start = new Date(startDate)
    const end = current ? new Date() : new Date(endDate || new Date())
    const diffTime = Math.abs(end.getTime() - start.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    const years = Math.floor(diffDays / 365)
    const months = Math.floor((diffDays % 365) / 30)
    
    if (years > 0) {
      return months > 0 ? `${years} yr ${months} mo` : `${years} yr`
    }
    return `${months} mo`
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Briefcase className="h-5 w-5" />
          Experience
        </CardTitle>
        {isEditable && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" onClick={() => setEditingExperience(null)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Experience
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingExperience ? "Edit Experience" : "Add Experience"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="title">Position Title *</Label>
                    <Input
                      id="title"
                      value={formData.title || ""}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="e.g. Senior Software Engineer"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="company">Company *</Label>
                    <Input
                      id="company"
                      value={formData.company || ""}
                      onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                      placeholder="e.g. Google"
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={formData.location || ""}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="e.g. San Francisco, CA"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="current"
                    checked={formData.current}
                    onCheckedChange={(checked) => 
                      setFormData({ ...formData, current: checked as boolean })
                    }
                  />
                  <Label htmlFor="current">I currently work here</Label>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="startDate">Start Date *</Label>
                    <Input
                      id="startDate"
                      type="month"
                      value={formData.startDate || ""}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      required
                    />
                  </div>
                  {!formData.current && (
                    <div>
                      <Label htmlFor="endDate">End Date</Label>
                      <Input
                        id="endDate"
                        type="month"
                        value={formData.endDate || ""}
                        onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                      />
                    </div>
                  )}
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description || ""}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe your role, responsibilities, and achievements..."
                    rows={4}
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    {editingExperience ? "Update" : "Add"} Experience
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </CardHeader>
      <CardContent>
        {experiences.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            No experience added yet. {isEditable && "Click 'Add Experience' to get started."}
          </p>
        ) : (
          <div className="space-y-6">
            {experiences.map((experience, index) => (
              <div key={experience.id || `experience-${index}`} className="border-b last:border-b-0 pb-6 last:pb-0">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{experience.title}</h3>
                    <p className="text-muted-foreground font-medium">{experience.company}</p>
                    
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {formatDate(experience.startDate)} - {experience.current ? "Present" : experience.endDate ? formatDate(experience.endDate) : "Present"}
                      </div>
                      <span>•</span>
                      <span>{getDuration(experience.startDate, experience.endDate, experience.current)}</span>
                      {experience.location && (
                        <>
                          <span>•</span>
                          <div className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            {experience.location}
                          </div>
                        </>
                      )}
                    </div>

                    {experience.description && (
                      <p className="text-sm mt-3 whitespace-pre-wrap">{experience.description}</p>
                    )}

                    {experience.skills && experience.skills.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {experience.skills.map((skill, index) => (
                          <Badge key={`${experience.id}-${skill}-${index}`} variant="secondary" className="text-xs">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  {isEditable && (
                    <div className="flex gap-2 ml-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(experience)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(experience.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
