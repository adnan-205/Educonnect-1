export interface IUser {
  _id: string;
  name: string;
  email: string;
  password: string;
  role: 'student' | 'teacher';
  avatar?: string; // Cloudinary URL
  coverImage?: string; // Cloudinary URL
  profile?: {
    bio?: string;
    education?: string[];
    experience?: string[];
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
  createdAt: Date;
  updatedAt: Date;
}
