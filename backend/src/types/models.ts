export interface IExperience {
  title?: string;
  company?: string;
  location?: string;
  startDate?: string;
  endDate?: string;
  current?: boolean;
  description?: string;
  skills?: string[];
}

export interface IEducation {
  degree?: string;
  institution?: string;
  location?: string;
  startDate?: string;
  endDate?: string;
  current?: boolean;
  description?: string;
  gpa?: string;
  activities?: string[];
}

export interface IWork {
  position?: string;
  company?: string;
  location?: string;
  startDate?: string;
  endDate?: string;
  current?: boolean;
  description?: string;
  achievements?: string[];
}

export interface IDemoVideo {
  title?: string;
  description?: string;
  videoUrl?: string;
  thumbnailUrl?: string;
  duration?: string;
  subject?: string;
  uploadDate?: string;
  videoType?: 'local' | 'external';
  cloudinaryPublicId?: string;
}

export interface IUser {
  _id: string;
  name: string;
  email: string;
  password: string;
  role: 'student' | 'teacher';
  // Optional contact and presentation
  phone?: string;
  location?: string;
  headline?: string;
  // Media
  avatar?: string; // Cloudinary URL
  coverImage?: string; // Cloudinary URL
  // Rich profile
  profile?: {
    bio?: string;
    experiences?: IExperience[];
    education?: IEducation[];
    work?: IWork[];
    demoVideos?: IDemoVideo[];
    skills?: string[];
    languages?: string[];
    subjects?: string[];
    hourlyRate?: number;
    availability?: string;
    timezone?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface IGig {
  _id: string;
  teacher: string | IUser;
  title: string;
  description: string;
  price: number;
  category: string;
  duration: number;
  thumbnailUrl?: string;
  availability: {
    days: string[];
    times: string[];
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface IBooking {
  _id: string;
  student: string | IUser;
  gig: string | IGig;
  status: 'pending' | 'accepted' | 'rejected' | 'completed';
  scheduledDate: Date;
  scheduledTime: string;
  // Canonical UTC datetime and user's timezone
  scheduledAt?: Date;
  timeZone?: string;
  // Meeting fields
  meetingLink?: string;
  meetingRoomId?: string;
  createdAt: Date;
  updatedAt: Date;
}
