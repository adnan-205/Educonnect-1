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
}, {
  timestamps: true,
});

export default mongoose.model<IBooking>('Booking', bookingSchema);
