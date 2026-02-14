import mongoose, { Document, Schema } from 'mongoose';

export interface IPaymentTrxRegistry extends Document {
  trxid: string;
  bookingId: mongoose.Types.ObjectId;
  teacherId: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  amount: number;
  method: 'bkash' | 'nagad' | 'bank';
  createdAt: Date;
}

const paymentTrxRegistrySchema = new Schema<IPaymentTrxRegistry>(
  {
    trxid: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    bookingId: {
      type: Schema.Types.ObjectId,
      ref: 'Booking',
      required: true,
      index: true,
    },
    teacherId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    studentId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    method: {
      type: String,
      enum: ['bkash', 'nagad', 'bank'],
      required: true,
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

// Unique index on trxid to prevent duplicate transaction IDs globally
// If you want per-teacher uniqueness instead, use: { trxid: 1, teacherId: 1 }
paymentTrxRegistrySchema.index({ trxid: 1 }, { unique: true });

export default mongoose.model<IPaymentTrxRegistry>('PaymentTrxRegistry', paymentTrxRegistrySchema);
