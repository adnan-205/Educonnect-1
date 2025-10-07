import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IPayment extends Document {
  gigId: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  teacherId: mongoose.Types.ObjectId;
  bookingId?: mongoose.Types.ObjectId;
  amount: number;
  status: 'PENDING' | 'SUCCESS' | 'FAILED';
  transactionId: string;
  statusHistory?: { status: string; at: Date }[];
  createdAt: Date;
  updatedAt: Date;
}

const paymentSchema = new Schema<IPayment>({
  gigId: { type: Schema.Types.ObjectId, ref: 'Gig', required: true },
  studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  teacherId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  bookingId: { type: Schema.Types.ObjectId, ref: 'Booking', required: false, index: true },
  amount: { type: Number, required: true },
  status: { type: String, enum: ['PENDING', 'SUCCESS', 'FAILED'], default: 'PENDING', index: true },
  transactionId: { type: String, required: true, unique: true, index: true },
  statusHistory: [{
    status: { type: String, enum: ['PENDING', 'SUCCESS', 'FAILED'] },
    at: { type: Date, default: Date.now }
  }],
}, { timestamps: true });

// Compound indexes to accelerate status lookups
paymentSchema.index({ bookingId: 1, studentId: 1, status: 1 });
paymentSchema.index({ gigId: 1, studentId: 1, status: 1 });

const Payment: Model<IPayment> = mongoose.models.Payment || mongoose.model<IPayment>('Payment', paymentSchema);
export default Payment;
