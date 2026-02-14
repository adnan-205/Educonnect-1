import mongoose, { Document, Schema } from 'mongoose';

export interface ITeacherPaymentInfo extends Document {
  teacherId: mongoose.Types.ObjectId;
  bkashNumber?: string;
  nagadNumber?: string;
  bankDetails?: {
    bankName?: string;
    accountNumber?: string;
    accountName?: string;
    branchName?: string;
    routingNumber?: string;
  };
  accountName?: string;
  instructions?: string;
  createdAt: Date;
  updatedAt: Date;
}

const teacherPaymentInfoSchema = new Schema<ITeacherPaymentInfo>(
  {
    teacherId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    bkashNumber: {
      type: String,
      trim: true,
    },
    nagadNumber: {
      type: String,
      trim: true,
    },
    bankDetails: {
      bankName: String,
      accountNumber: String,
      accountName: String,
      branchName: String,
      routingNumber: String,
    },
    accountName: {
      type: String,
      trim: true,
    },
    instructions: {
      type: String,
      maxlength: 1000,
    },
  },
  { timestamps: true }
);

export default mongoose.model<ITeacherPaymentInfo>('TeacherPaymentInfo', teacherPaymentInfoSchema);
