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
}, {
  timestamps: true,
});

export default mongoose.model<IGig>('Gig', gigSchema);
