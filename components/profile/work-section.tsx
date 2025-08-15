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
import { Plus, Edit, Trash2, Building, Calendar, MapPin } from "lucide-react"
import { Work } from "@/lib/types/profile"

interface WorkSectionProps {
  work: Work[]
  onUpdate: (work: Work[]) => void
  isEditable?: boolean
}

export function WorkSection({ work, onUpdate, isEditable = true }: WorkSectionProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingWork, setEditingWork] = useState<Work | null>(null)
  const [formData, setFormData] = useState<Partial<Work>>({
    position: "",
    company: "",
    location: "",
    startDate: "",
    endDate: "",
    current: false,
    description: "",
    achievements: []
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.position || !formData.company || !formData.startDate) return

    const newWork: Work = {
      id: editingWork?.id || Date.now().toString(),
      position: formData.position!,
      company: formData.company!,
      location: formData.location || "",
      startDate: formData.startDate!,
      endDate: formData.current ? undefined : formData.endDate,
      current: formData.current || false,
      description: formData.description || "",
      achievements: formData.achievements || []
    }

    let updatedWork
    if (editingWork) {
      updatedWork = work.map(w => 
        w.id === editingWork.id ? newWork : w
      )
    } else {
      updatedWork = [...work, newWork]
    }

    onUpdate(updatedWork)
    resetForm()
  }

  const handleDelete = (id: string) => {
    const updatedWork = work.filter(w => w.id !== id)
    onUpdate(updatedWork)
  }

  const handleEdit = (workItem: Work) => {
    setEditingWork(workItem)
    setFormData({
      position: workItem.position,
      company: workItem.company,
      location: workItem.location,
      startDate: workItem.startDate,
      endDate: workItem.endDate,
      current: workItem.current,
      description: workItem.description,
      achievements: workItem.achievements
    })
    setIsDialogOpen(true)
  }

  const resetForm = () => {
    setFormData({
      position: "",
      company: "",
      location: "",
      startDate: "",
      endDate: "",
      current: false,
      description: "",
      achievements: []
    })
    setEditingWork(null)
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
          <Building className="h-5 w-5" />
          Work Experience
        </CardTitle>
        {isEditable && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" onClick={() => setEditingWork(null)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Work
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingWork ? "Edit Work Experience" : "Add Work Experience"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="position">Position *</Label>
                    <Input
                      id="position"
                      value={formData.position || ""}
                      onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                      placeholder="e.g. Software Engineer"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="company">Company *</Label>
                    <Input
                      id="company"
                      value={formData.company || ""}
                      onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                      placeholder="e.g. Microsoft"
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
                    placeholder="e.g. Seattle, WA"
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
                    placeholder="Describe your role, responsibilities, and key achievements..."
                    rows={4}
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    {editingWork ? "Update" : "Add"} Work Experience
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </CardHeader>
      <CardContent>
        {work.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            No work experience added yet. {isEditable && "Click 'Add Work' to get started."}
          </p>
        ) : (
          <div className="space-y-6">
            {work.map((workItem) => (
              <div key={workItem.id} className="border-b last:border-b-0 pb-6 last:pb-0">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{workItem.position}</h3>
                    <p className="text-muted-foreground font-medium">{workItem.company}</p>
                    
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {formatDate(workItem.startDate)} - {workItem.current ? "Present" : workItem.endDate ? formatDate(workItem.endDate) : "Present"}
                      </div>
                      <span>•</span>
                      <span>{getDuration(workItem.startDate, workItem.endDate, workItem.current)}</span>
                      {workItem.location && (
                        <>
                          <span>•</span>
                          <div className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            {workItem.location}
                          </div>
                        </>
                      )}
                    </div>

                    {workItem.description && (
                      <p className="text-sm mt-3 whitespace-pre-wrap">{workItem.description}</p>
                    )}

                    {workItem.achievements && workItem.achievements.length > 0 && (
                      <div className="mt-3">
                        <p className="text-sm font-medium mb-2">Key Achievements:</p>
                        <ul className="text-sm space-y-1">
                          {workItem.achievements.map((achievement, index) => (
                            <li key={index} className="flex items-start gap-2">
                              <span className="text-muted-foreground mt-1">•</span>
                              <span>{achievement}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                  
                  {isEditable && (
                    <div className="flex gap-2 ml-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(workItem)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(workItem.id)}
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
