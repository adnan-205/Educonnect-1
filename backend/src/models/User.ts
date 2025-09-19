import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { IUser } from '../types/models';

// Sub-schemas for rich profile sections (no own _id for cleaner arrays)
const ExperienceSchema = new mongoose.Schema({
  title: String,
  company: String,
  location: String,
  startDate: String,
  endDate: String,
  current: Boolean,
  description: String,
  skills: [String],
}, { _id: false });

const EducationSchema = new mongoose.Schema({
  degree: String,
  institution: String,
  location: String,
  startDate: String,
  endDate: String,
  current: Boolean,
  description: String,
  gpa: String,
  activities: [String],
}, { _id: false });

const WorkSchema = new mongoose.Schema({
  position: String,
  company: String,
  location: String,
  startDate: String,
  endDate: String,
  current: Boolean,
  description: String,
  achievements: [String],
}, { _id: false });

const DemoVideoSchema = new mongoose.Schema({
  title: String,
  description: String,
  videoUrl: String,
  thumbnailUrl: String,
  duration: String,
  subject: String,
  uploadDate: String,
  videoType: { type: String, enum: ['local', 'external'] },
  cloudinaryPublicId: String,
}, { _id: false });

const userSchema = new mongoose.Schema<IUser>({
  name: {
    type: String,
    required: [true, 'Please add a name'],
  },
  email: {
    type: String,
    required: [true, 'Please add an email'],
    unique: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please add a valid email'],
  },
  password: {
    type: String,
    required: [true, 'Please add a password'],
    minlength: 6,
    select: false,
  },
  role: {
    type: String,
    enum: ['student', 'teacher', 'admin'],
    required: true,
  },
  // Onboarding status and marketing attribution
  isOnboarded: {
    type: Boolean,
    default: false,
  },
  marketingSource: { type: String },
  // Optional contact and headline
  phone: { type: String },
  location: { type: String },
  headline: { type: String },
  avatar: {
    type: String,
  },
  coverImage: {
    type: String,
  },
  profile: {
    bio: String,
    // Professional sections
    experiences: [ExperienceSchema],
    education: [EducationSchema],
    work: [WorkSchema],
    demoVideos: [DemoVideoSchema],
    // Skills and languages
    skills: [String],
    languages: [String],
    subjects: [String],
    // Teacher specifics
    hourlyRate: Number,
    availability: String,
    timezone: String,
  },
}, {
  timestamps: true,
});

// Encrypt password using bcrypt
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Match user entered password to hashed password in database
userSchema.methods.matchPassword = async function(enteredPassword: string) {
  return await bcrypt.compare(enteredPassword, this.password);
};

export default mongoose.model<IUser>('User', userSchema);
