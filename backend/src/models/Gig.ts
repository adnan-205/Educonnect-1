import mongoose from 'mongoose';
import { IGig } from '../types/models';

const gigSchema = new mongoose.Schema<IGig>({
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  title: {
    type: String,
    required: [true, 'Please add a title'],
    trim: true,
    maxlength: [100, 'Title cannot be more than 100 characters'],
  },
  description: {
    type: String,
    required: [true, 'Please add a description'],
    maxlength: [500, 'Description cannot be more than 500 characters'],
  },
  price: {
    type: Number,
    required: [true, 'Please add a price'],
  },
  category: {
    type: String,
    required: [true, 'Please add a category'],
  },
  duration: {
    type: Number,
    required: [true, 'Please add duration in minutes'],
  },
  averageRating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5,
    index: true,
  },
  reviewsCount: {
    type: Number,
    default: 0,
    min: 0,
  },
  thumbnailUrl: {
    type: String,
  },
  thumbnailPublicId: {
    type: String,
  },
  availability: {
    days: [{
      type: String,
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    }],
    times: [String],
  },
  // Ranking & Promotion fields (like Upwork/Fiverr)
  isFeatured: {
    type: Boolean,
    default: false,
    index: true,
  },
  isPromoted: {
    type: Boolean,
    default: false,
    index: true,
  },
  promotedUntil: {
    type: Date,
    default: null,
  },
  completedBookingsCount: {
    type: Number,
    default: 0,
    min: 0,
    index: true,
  },
  viewsCount: {
    type: Number,
    default: 0,
    min: 0,
  },
  // Ranking score computed from multiple factors
  rankingScore: {
    type: Number,
    default: 0,
    index: true,
  },
}, {
  timestamps: true,
});

// Compound index for efficient category + ranking queries
gigSchema.index({ category: 1, rankingScore: -1 });
gigSchema.index({ category: 1, isFeatured: -1, isPromoted: -1, rankingScore: -1 });

export default mongoose.model<IGig>('Gig', gigSchema);
