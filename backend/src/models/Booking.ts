import mongoose from 'mongoose';
import { IBooking } from '../types/models';

const bookingSchema = new mongoose.Schema<IBooking>({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  gig: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Gig',
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected', 'completed'],
    default: 'pending',
  },
  scheduledDate: {
    type: Date,
    required: [true, 'Please add a scheduled date'],
  },
  scheduledTime: {
    type: String,
    required: [true, 'Please add a scheduled time'],
  },
  // Canonical UTC datetime for the class start time
  scheduledAt: {
    type: Date,
    required: false,
    index: true,
  },
  // IANA timezone string of the student when booking (e.g., "Asia/Dhaka")
  timeZone: {
    type: String,
    required: false,
  },
  // Optional meeting fields (used by Jitsi integration)
  meetingLink: {
    type: String,
    required: false,
  },
  meetingRoomId: {
    type: String,
    required: false,
  },
  meetingPassword: {
    type: String,
    required: false,
    select: true,
  },
  // Attendance tracking (student)
  attended: {
    type: Boolean,
    default: false,
    required: false,
    index: true,
  },
  attendedAt: {
    type: Date,
    required: false,
  },
  // Rating & review snapshot fields (for quick access per booking)
  teacherRating: {
    type: Number,
    min: 1,
    max: 5,
    required: false,
  },
  studentRating: {
    type: Number,
    min: 1,
    max: 5,
    required: false,
  },
  reviewComment: {
    type: String,
    maxlength: 2000,
    required: false,
  },
  reviewVisibility: {
    type: Boolean,
    default: false,
    index: true,
  },
}, {
  timestamps: true,
});

export default mongoose.model<IBooking>('Booking', bookingSchema);
