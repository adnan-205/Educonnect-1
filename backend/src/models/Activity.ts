import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IActivity extends Document {
  user: mongoose.Types.ObjectId;
  action: string;
  targetType?: string;
  targetId?: mongoose.Types.ObjectId;
  metadata?: Record<string, any>;
  ip?: string;
  userAgent?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ActivitySchema = new Schema<IActivity>({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  action: { type: String, required: true, index: true },
  targetType: { type: String, index: true },
  targetId: { type: Schema.Types.ObjectId, index: true },
  metadata: { type: Schema.Types.Mixed },
  ip: { type: String },
  userAgent: { type: String },
}, { timestamps: true });

ActivitySchema.index({ createdAt: -1 });
ActivitySchema.index({ user: 1, createdAt: -1 });
ActivitySchema.index({ action: 1, createdAt: -1 });

const Activity: Model<IActivity> = mongoose.models.Activity || mongoose.model<IActivity>('Activity', ActivitySchema);
export default Activity;
