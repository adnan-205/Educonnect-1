import mongoose from 'mongoose';
import { IBooking } from '../types/models';
import crypto from 'crypto';

// Generate a short unique payment reference code
const generatePaymentRefCode = (): string => {
  const rand = crypto.randomBytes(4).toString('hex').toUpperCase();
  return `TC-BOOK-${rand}`;
};

// Manual payment sub-schema
const manualPaymentSchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: ['pending_manual', 'submitted', 'verified', 'rejected', 'expired'],
      default: 'pending_manual',
    },
    method: {
      type: String,
      enum: ['bkash', 'nagad', 'bank'],
    },
    amountExpected: {
      type: Number,
      min: 0,
    },
    amountPaid: {
      type: Number,
      min: 0,
    },
    trxid: {
      type: String,
      trim: true,
    },
    senderNumber: {
      type: String,
      trim: true,
    },
    screenshotUrl: {
      type: String,
    },
    submittedAt: Date,
    verifiedAt: Date,
    rejectedAt: Date,
    rejectReason: {
      type: String,
      maxlength: 500,
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    submissionCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    acceptedAt: Date, // when booking was accepted (for timeout calculation)
  },
  { _id: false }
);

// Payment audit log entry sub-schema
const paymentAuditLogSchema = new mongoose.Schema(
  {
    action: {
      type: String,
      required: true,
    },
    fromStatus: String,
    toStatus: String,
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    note: String,
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

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
  // Manual payment fields
  manualPayment: manualPaymentSchema,
  paymentRefCode: {
    type: String,
    unique: true,
    sparse: true,
    default: generatePaymentRefCode,
  },
  paymentMethodType: {
    type: String,
    enum: ['manual', 'sslcommerz', 'none'],
    default: 'none',
  },
  joinUnlocked: {
    type: Boolean,
    default: false,
    index: true,
  },
  paymentAuditLog: [paymentAuditLogSchema],
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
