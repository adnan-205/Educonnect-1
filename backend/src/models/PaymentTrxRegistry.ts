import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IPaymentTrxRegistry extends Document {
  method: 'bkash' | 'nagad' | 'bank';
  trxid: string;
  bookingId: mongoose.Types.ObjectId;
  teacherId: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  amount: number;
  createdAt: Date;
}

const paymentTrxRegistrySchema = new Schema<IPaymentTrxRegistry>(
  {
    method: {
      type: String,
      enum: ['bkash', 'nagad', 'bank'],
      required: true,
    },
    trxid: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
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
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

// Unique index on (method, trxid) to prevent duplicate transaction IDs per payment method
paymentTrxRegistrySchema.index({ method: 1, trxid: 1 }, { unique: true });

const PaymentTrxRegistry: Model<IPaymentTrxRegistry> =
  mongoose.models.PaymentTrxRegistry ||
  mongoose.model<IPaymentTrxRegistry>('PaymentTrxRegistry', paymentTrxRegistrySchema);

export default PaymentTrxRegistry;
