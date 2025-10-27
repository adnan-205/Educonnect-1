import Activity from '../models/Activity';
import mongoose from 'mongoose';
import { Request } from 'express';

export type LogActivityParams = {
  userId: string | mongoose.Types.ObjectId | null | undefined;
  action: string;
  targetType?: string;
  targetId?: string | mongoose.Types.ObjectId;
  metadata?: Record<string, any>;
  req?: Request;
};

export async function logActivity(params: LogActivityParams) {
  try {
    const { userId, action, targetType, targetId, metadata, req } = params;
    if (!userId) return;
    const doc: any = {
      user: new mongoose.Types.ObjectId(String(userId)),
      action,
    };
    if (targetType) doc.targetType = targetType;
    if (targetId) doc.targetId = new mongoose.Types.ObjectId(String(targetId));
    if (metadata) doc.metadata = metadata;
    if (req) {
      try {
        doc.ip = (req.headers['x-forwarded-for'] as string) || req.ip;
        doc.userAgent = req.get('User-Agent') || undefined;
      } catch {}
    }
    await Activity.create(doc);
  } catch (e) {
    // swallow logging errors
  }
}
