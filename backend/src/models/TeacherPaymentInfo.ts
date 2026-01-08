import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ITeacherPaymentInfo extends Document {
  teacherId: mongoose.Types.ObjectId;
  bkashNumber?: string;
  nagadNumber?: string;
  bankAccountName?: string;
  bankAccountNumber?: string;
  bankName?: string;
  bankBranch?: string;
  routingNumber?: string;
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
      maxlength: 20,
    },
    nagadNumber: {
      type: String,
      trim: true,
      maxlength: 20,
    },
    bankAccountName: {
      type: String,
      trim: true,
      maxlength: 100,
    },
    bankAccountNumber: {
      type: String,
      trim: true,
      maxlength: 50,
    },
    bankName: {
      type: String,
      trim: true,
      maxlength: 100,
    },
    bankBranch: {
      type: String,
      trim: true,
      maxlength: 100,
    },
    routingNumber: {
      type: String,
      trim: true,
      maxlength: 20,
    },
    instructions: {
      type: String,
      trim: true,
      maxlength: 500,
    },
  },
  { timestamps: true }
);

const TeacherPaymentInfo: Model<ITeacherPaymentInfo> =
  mongoose.models.TeacherPaymentInfo ||
  mongoose.model<ITeacherPaymentInfo>('TeacherPaymentInfo', teacherPaymentInfoSchema);

export default TeacherPaymentInfo;
