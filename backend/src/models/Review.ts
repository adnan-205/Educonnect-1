import mongoose, { Schema, Types } from 'mongoose';
import { IReview } from '../types/models';

const reviewSchema = new mongoose.Schema<IReview>({
  gig: { type: Schema.Types.ObjectId, ref: 'Gig', required: true, index: true },
  teacher: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  student: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  booking: { type: Schema.Types.ObjectId, ref: 'Booking' },
  rating: { type: Number, required: true, min: 1, max: 5 },
  title: { type: String, trim: true, maxlength: 120 },
  comment: { type: String, trim: true, maxlength: 2000 },
  teacherReply: { type: String, trim: true, maxlength: 2000 },
  teacherReplyAt: { type: Date },
}, {
  timestamps: true,
});

// A student can review a gig only once (per gig)
reviewSchema.index({ student: 1, gig: 1 }, { unique: true });

export default mongoose.model<IReview>('Review', reviewSchema);
