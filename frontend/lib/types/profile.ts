export interface Experience {
  id: string
  title: string
  company: string
  location?: string
  startDate: string
  endDate?: string
  current: boolean
  description: string
  skills?: string[]
}

export interface Education {
  id: string
  degree: string
  institution: string
  location?: string
  startDate: string
  endDate?: string
  current: boolean
  description?: string
  gpa?: string
  activities?: string[]
}

export interface Work {
  id: string
  position: string
  company: string
  location?: string
  startDate: string
  endDate?: string
  current: boolean
  description: string
  achievements?: string[]
}

export interface UserProfile {
  id: string
  name: string
  email: string
  phone?: string
  location?: string
  bio: string
  avatar?: string
  coverImage?: string
  headline: string
  userType: 'student' | 'teacher'

  // Professional sections
  experiences: Experience[]
  education: Education[]
  work: Work[]

  // Skills and languages
  skills: string[]
  languages: string[]

  // Teacher specific
  subjects?: string[]
  hourlyRate?: number
  availability?: string
  timezone?: string
  demoVideos?: DemoVideo[]

  // Stats
  rating?: number
  totalStudents?: number
  totalHours?: number
  reviews?: number
  completionRate?: number
  responseTime?: string
}

export interface DemoVideo {
  id: string
  title: string
  description: string
  videoUrl: string
  thumbnailUrl?: string
  duration: string
  subject: string
  uploadDate: string
  videoType: 'local' | 'external'
  localFile?: File
  cloudinaryPublicId?: string
}

export interface ProfileFormData {
  title: string
  company: string
  location?: string
  startDate: string
  endDate?: string
  current: boolean
  description: string
}
