import mongoose from 'mongoose';
import crypto from 'crypto';
import { IBooking } from '../types/models';

// Sub-schema for receiver snapshot (teacher payment info at submission time)
const ReceiverSnapshotSchema = new mongoose.Schema(
  {
    bkashNumber: String,
    nagadNumber: String,
    bankAccountName: String,
    bankAccountNumber: String,
    bankName: String,
    bankBranch: String,
    routingNumber: String,
    snapshotAt: Date,
  },
  { _id: false }
);

// Sub-schema for manual payment
const ManualPaymentSchema = new mongoose.Schema(
  {
    methodType: {
      type: String,
      enum: ['manual', 'sslcommerz'],
      default: 'manual',
    },
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
      maxlength: 100,
    },
    senderNumber: {
      type: String,
      trim: true,
      maxlength: 20,
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
      max: 10,
    },
    receiverSnapshot: ReceiverSnapshotSchema,
    // Timeout tracking
    acceptedAt: Date, // when booking was accepted (payment window starts)
  },
  { _id: false }
);

// Sub-schema for audit log entries
const AuditLogEntrySchema = new mongoose.Schema(
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
  // Manual payment subdocument
  manualPayment: ManualPaymentSchema,
  // Unique reference code for payment (e.g., "TC-BOOK-abc123")
  paymentRefCode: {
    type: String,
    unique: true,
    sparse: true,
    index: true,
  },
  // Audit log for payment status changes
  paymentAuditLog: [AuditLogEntrySchema],
}, {
  timestamps: true,
});

// Generate paymentRefCode before save if not present
bookingSchema.pre('save', function (next) {
  if (!this.paymentRefCode) {
    const shortId = crypto.randomBytes(4).toString('hex').toUpperCase();
    this.paymentRefCode = `TC-BOOK-${shortId}`;
  }
  next();
});

// Index for efficient queries on manual payment status
bookingSchema.index({ 'manualPayment.status': 1 });
bookingSchema.index({ 'manualPayment.methodType': 1 });

export default mongoose.model<IBooking>('Booking', bookingSchema);
