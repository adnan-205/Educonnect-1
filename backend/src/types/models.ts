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
  role: 'student' | 'teacher' | 'admin';
  // Optional contact and presentation
  phone?: string;
  location?: string;
  headline?: string;
  // Teacher rating aggregates (only relevant for role=teacher)
  teacherRatingSum?: number;
  teacherReviewsCount?: number;
  teacherRatingAverage?: number;
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
  // Wallet reference (for teachers)
  wallet?: string;
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
  thumbnailPublicId?: string;
  availability: {
    days: string[];
    times: string[];
  };
  averageRating?: number;
  reviewsCount?: number;
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
  meetingPassword?: string;
  // Attendance tracking
  attended?: boolean;
  attendedAt?: Date;
  // Review fields (snapshot on booking)
  teacherRating?: number;
  studentRating?: number;
  reviewComment?: string;
  reviewVisibility?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IReview {
  _id: string;
  gig: string | IGig;
  teacher: string | IUser;
  student: string | IUser;
  booking?: string | IBooking;
  rating: number; // 1..5
  title?: string;
  comment?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IWallet {
  _id: string;
  teacher: string | IUser;
  balance: number;
  totalEarned: number;
  totalWithdrawn: number;
  currency: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IWalletTransaction {
  _id: string;
  wallet: string | IWallet;
  teacher: string | IUser;
  type: 'CREDIT' | 'WITHDRAWAL';
  amount: number;
  commission: number;
  netAmount: number;
  status: 'PENDING' | 'COMPLETED' | 'REJECTED' | 'CANCELLED';
  description: string;
  payment?: string;
  booking?: string;
  withdrawalMethod?: 'BANK_TRANSFER' | 'MOBILE_BANKING' | 'PAYPAL' | 'OTHER';
  withdrawalDetails?: {
    accountNumber?: string;
    accountName?: string;
    bankName?: string;
    branchName?: string;
    routingNumber?: string;
    mobileNumber?: string;
    [key: string]: any;
  };
  processedBy?: string | IUser;
  processedAt?: Date;
  rejectionReason?: string;
  createdAt: Date;
  updatedAt: Date;
}
