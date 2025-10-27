import mongoose, { Schema, Document, Model } from 'mongoose';

export type TransactionType = 'CREDIT' | 'WITHDRAWAL';
export type TransactionStatus = 'PENDING' | 'COMPLETED' | 'REJECTED' | 'CANCELLED';

export interface IWalletTransaction extends Document {
  wallet: mongoose.Types.ObjectId;
  teacher: mongoose.Types.ObjectId;
  type: TransactionType;
  amount: number;
  commission: number;
  netAmount: number;
  status: TransactionStatus;
  description: string;
  
  // For CREDIT transactions
  payment?: mongoose.Types.ObjectId;
  booking?: mongoose.Types.ObjectId;
  
  // For WITHDRAWAL transactions
  withdrawalMethod?: string;
  withdrawalDetails?: {
    accountNumber?: string;
    accountName?: string;
    bankName?: string;
    branchName?: string;
    routingNumber?: string;
    mobileNumber?: string;
    [key: string]: any;
  };
  
  // Admin approval tracking
  processedBy?: mongoose.Types.ObjectId;
  processedAt?: Date;
  rejectionReason?: string;
  
  createdAt: Date;
  updatedAt: Date;
}

const walletTransactionSchema = new Schema<IWalletTransaction>({
  wallet: {
    type: Schema.Types.ObjectId,
    ref: 'Wallet',
    required: true,
    index: true,
  },
  teacher: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  type: {
    type: String,
    enum: ['CREDIT', 'WITHDRAWAL'],
    required: true,
    index: true,
  },
  amount: {
    type: Number,
    required: true,
    min: 0,
  },
  commission: {
    type: Number,
    default: 0,
    min: 0,
  },
  netAmount: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: ['PENDING', 'COMPLETED', 'REJECTED', 'CANCELLED'],
    default: 'PENDING',
    index: true,
  },
  description: {
    type: String,
    required: true,
  },
  
  // Credit-related fields
  payment: {
    type: Schema.Types.ObjectId,
    ref: 'Payment',
    required: false,
  },
  booking: {
    type: Schema.Types.ObjectId,
    ref: 'Booking',
    required: false,
  },
  
  // Withdrawal-related fields
  withdrawalMethod: {
    type: String,
    enum: ['BANK_TRANSFER', 'MOBILE_BANKING', 'PAYPAL', 'OTHER'],
    required: false,
  },
  withdrawalDetails: {
    type: Schema.Types.Mixed,
    required: false,
  },
  
  // Admin processing
  processedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: false,
  },
  processedAt: {
    type: Date,
    required: false,
  },
  rejectionReason: {
    type: String,
    required: false,
  },
}, { timestamps: true });

// Compound indexes for efficient queries
walletTransactionSchema.index({ teacher: 1, type: 1, status: 1 });
walletTransactionSchema.index({ wallet: 1, createdAt: -1 });
walletTransactionSchema.index({ status: 1, type: 1 });

const WalletTransaction: Model<IWalletTransaction> = 
  mongoose.models.WalletTransaction || 
  mongoose.model<IWalletTransaction>('WalletTransaction', walletTransactionSchema);

export default WalletTransaction;
