import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IWallet extends Document {
  teacher: mongoose.Types.ObjectId;
  balance: number;
  totalEarned: number;
  totalWithdrawn: number;
  currency: string;
  createdAt: Date;
  updatedAt: Date;
}

const walletSchema = new Schema<IWallet>({
  teacher: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true,
  },
  balance: {
    type: Number,
    default: 0,
    min: 0,
  },
  totalEarned: {
    type: Number,
    default: 0,
    min: 0,
  },
  totalWithdrawn: {
    type: Number,
    default: 0,
    min: 0,
  },
  currency: {
    type: String,
    default: 'BDT',
  },
}, { timestamps: true });

// Ensure balance is never negative
walletSchema.pre('save', function(next) {
  if (this.balance < 0) {
    return next(new Error('Wallet balance cannot be negative'));
  }
  next();
});

const Wallet: Model<IWallet> = mongoose.models.Wallet || mongoose.model<IWallet>('Wallet', walletSchema);
export default Wallet;
