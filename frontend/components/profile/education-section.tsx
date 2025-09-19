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
import { Plus, Edit, Trash2, GraduationCap, Calendar, MapPin } from "lucide-react"
import { Education } from "@/lib/types/profile"

interface EducationSectionProps {
  education: Education[]
  onUpdate: (education: Education[]) => void
  isEditable?: boolean
}

export function EducationSection({ education, onUpdate, isEditable = true }: EducationSectionProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingEducation, setEditingEducation] = useState<Education | null>(null)
  const [formData, setFormData] = useState<Partial<Education>>({
    degree: "",
    institution: "",
    location: "",
    startDate: "",
    endDate: "",
    current: false,
    description: "",
    gpa: "",
    activities: []
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.degree || !formData.institution || !formData.startDate) return

    const newEducation: Education = {
      id: editingEducation?.id || `edu_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      degree: formData.degree!,
      institution: formData.institution!,
      location: formData.location || "",
      startDate: formData.startDate!,
      endDate: formData.current ? undefined : formData.endDate,
      current: formData.current || false,
      description: formData.description || "",
      gpa: formData.gpa || "",
      activities: formData.activities || []
    }

    let updatedEducation
    if (editingEducation) {
      updatedEducation = education.map(edu => 
        edu.id === editingEducation.id ? newEducation : edu
      )
    } else {
      updatedEducation = [...education, newEducation]
    }

    onUpdate(updatedEducation)
    resetForm()
  }

  const handleDelete = (id: string) => {
    const updatedEducation = education.filter(edu => edu.id !== id)
    onUpdate(updatedEducation)
  }

  const handleEdit = (educationItem: Education) => {
    setEditingEducation(educationItem)
    setFormData({
      degree: educationItem.degree,
      institution: educationItem.institution,
      location: educationItem.location,
      startDate: educationItem.startDate,
      endDate: educationItem.endDate,
      current: educationItem.current,
      description: educationItem.description,
      gpa: educationItem.gpa,
      activities: educationItem.activities
    })
    setIsDialogOpen(true)
  }

  const resetForm = () => {
    setFormData({
      degree: "",
      institution: "",
      location: "",
      startDate: "",
      endDate: "",
      current: false,
      description: "",
      gpa: "",
      activities: []
    })
    setEditingEducation(null)
    setIsDialogOpen(false)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' })
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <GraduationCap className="h-5 w-5" />
          Education
        </CardTitle>
        {isEditable && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" onClick={() => setEditingEducation(null)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Education
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingEducation ? "Edit Education" : "Add Education"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="degree">Degree *</Label>
                    <Input
                      id="degree"
                      value={formData.degree || ""}
                      onChange={(e) => setFormData({ ...formData, degree: e.target.value })}
                      placeholder="e.g. Bachelor of Science in Computer Science"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="institution">Institution *</Label>
                    <Input
                      id="institution"
                      value={formData.institution || ""}
                      onChange={(e) => setFormData({ ...formData, institution: e.target.value })}
                      placeholder="e.g. Stanford University"
                      required
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      value={formData.location || ""}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      placeholder="e.g. Stanford, CA"
                    />
                  </div>
                  <div>
                    <Label htmlFor="gpa">GPA</Label>
                    <Input
                      id="gpa"
                      value={formData.gpa || ""}
                      onChange={(e) => setFormData({ ...formData, gpa: e.target.value })}
                      placeholder="e.g. 3.8/4.0"
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="current"
                    checked={formData.current}
                    onCheckedChange={(checked) => 
                      setFormData({ ...formData, current: checked as boolean })
                    }
                  />
                  <Label htmlFor="current">I am currently studying here</Label>
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
                    placeholder="Describe your studies, achievements, relevant coursework..."
                    rows={3}
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    {editingEducation ? "Update" : "Add"} Education
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </CardHeader>
      <CardContent>
        {education.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            No education added yet. {isEditable && "Click 'Add Education' to get started."}
          </p>
        ) : (
          <div className="space-y-6">
            {education.map((educationItem, index) => (
              <div key={educationItem.id || `education-${index}`} className="border-b last:border-b-0 pb-6 last:pb-0">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{educationItem.degree}</h3>
                    <p className="text-muted-foreground font-medium">{educationItem.institution}</p>
                    
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {formatDate(educationItem.startDate)} - {educationItem.current ? "Present" : educationItem.endDate ? formatDate(educationItem.endDate) : "Present"}
                      </div>
                      {educationItem.location && (
                        <>
                          <span>•</span>
                          <div className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            {educationItem.location}
                          </div>
                        </>
                      )}
                      {educationItem.gpa && (
                        <>
                          <span>•</span>
                          <span>GPA: {educationItem.gpa}</span>
                        </>
                      )}
                    </div>

                    {educationItem.description && (
                      <p className="text-sm mt-3 whitespace-pre-wrap">{educationItem.description}</p>
                    )}

                    {educationItem.activities && educationItem.activities.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {educationItem.activities.map((activity, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {activity}
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
                        onClick={() => handleEdit(educationItem)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(educationItem.id)}
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
