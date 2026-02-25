import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Review from '../models/Review';
import Gig from '../models/Gig';
import Booking from '../models/Booking';
import User from '../models/User';
import { logActivity } from '../utils/activityLogger';

const toObjectId = (id: string) => new mongoose.Types.ObjectId(id);

async function recomputeGigRatings(gigId: string) {
  const stats = await Review.aggregate([
    { $match: { gig: toObjectId(gigId) } },
    { $group: { _id: '$gig', count: { $sum: 1 }, avg: { $avg: '$rating' } } },
  ]);
  const count = stats[0]?.count || 0;
  const avg = stats[0]?.avg || 0;
  await Gig.findByIdAndUpdate(gigId, { reviewsCount: count, averageRating: Number(avg.toFixed(2)) });
}

// Incremental teacher rating update to avoid heavy aggregations each time
export async function incTeacherRating(teacherId: string, deltaSum: number, deltaCount: number) {
  // defensive: only teachers
  const teacher = await User.findById(teacherId).select('_id role');
  if (!teacher || teacher.role !== 'teacher') return;

  // Optimize using a single atomic pipeline update (MongoDB 4.2+)
  // Falls back to two-step if pipeline updates are not supported.
  try {
    await User.updateOne(
      { _id: teacherId },
      [
        {
          $set: {
            teacherRatingSum: { $add: [ '$teacherRatingSum', deltaSum ] },
            teacherReviewsCount: {
              $let: {
                vars: { nc: { $add: [ '$teacherReviewsCount', deltaCount ] } },
                in: { $cond: [ { $lt: ['$$nc', 0] }, 0, '$$nc' ] }
              }
            }
          }
        },
        {
          $set: {
            teacherRatingAverage: {
              $cond: [
                { $gt: [ '$teacherReviewsCount', 0 ] },
                { $round: [ { $divide: [ '$teacherRatingSum', '$teacherReviewsCount' ] }, 2 ] },
                0
              ]
            }
          }
        }
      ] as any
    );
  } catch (e) {
    // Fallback: two-step update
    const updated = await User.findByIdAndUpdate(
      teacherId,
      { $inc: { teacherRatingSum: deltaSum, teacherReviewsCount: deltaCount } },
      { new: true, select: 'teacherRatingSum teacherReviewsCount' }
    );
    if (updated) {
      const sum = updated.teacherRatingSum ?? 0;
      const count = updated.teacherReviewsCount ?? 0;

      const avg = count > 0
        ? Number((sum / count).toFixed(2))
        : 0;
      await User.findByIdAndUpdate(teacherId, { $set: { teacherRatingAverage: avg } });
    }
  }
}

// POST /api/reviews/batch-status - Check review status for multiple gigs at once
export const batchCheckReviewStatus = async (req: Request, res: Response) => {
  try {
    const studentId = (req.user as any)?._id;
    if (!studentId) return res.status(401).json({ success: false, message: 'Not authorized' });

    let { gigIds } = req.body || {};
    if (!Array.isArray(gigIds) || gigIds.length === 0) {
      return res.json({ success: true, data: {} });
    }
    // Cap at 100 to prevent abuse
    gigIds = gigIds.slice(0, 100);

    const reviews = await Review.find({
      student: studentId,
      gig: { $in: gigIds },
    }).select('gig');

    const reviewedGigIds = new Set(reviews.map((r: any) => String(r.gig)));
    const result: Record<string, boolean> = {};
    for (const gid of gigIds) {
      result[gid] = reviewedGigIds.has(String(gid));
    }

    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error checking review status' });
  }
};

// GET /api/reviews?gig=...&teacher=...&student=...&page=&limit=&sort=
export const getReviews = async (req: Request, res: Response) => {
  try {
    const { gig, teacher, student } = req.query as any;
    const page = Math.max(parseInt(String(req.query.page || '1'), 10), 1);
    const limit = Math.min(Math.max(parseInt(String(req.query.limit || '10'), 10), 1), 100);
    const sort = String(req.query.sort || '-createdAt');

    const filter: any = {};
    if (gig) filter.gig = gig;
    if (teacher) filter.teacher = teacher;
    if (student) filter.student = student;

    const [items, total] = await Promise.all([
      Review.find(filter)
        .sort(sort)
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('student', 'name avatar')
        .populate('teacher', 'name avatar')
        .populate('gig', 'title'),
      Review.countDocuments(filter),
    ]);

    res.json({
      success: true,
      count: items.length,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      data: items,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error fetching reviews' });
  }
};

// GET /api/gigs/:gigId/reviews
export const getGigReviews = async (req: Request, res: Response) => {
  try {
    const gigId = req.params.gigId;
    const page = Math.max(parseInt(String(req.query.page || '1'), 10), 1);
    const limit = Math.min(Math.max(parseInt(String(req.query.limit || '10'), 10), 1), 100);
    const sort = String(req.query.sort || '-createdAt');

    const filter: any = { gig: gigId };
    const [items, total] = await Promise.all([
      Review.find(filter)
        .sort(sort)
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('student', 'name avatar')
        .populate('teacher', 'name avatar')
        .populate('gig', 'title'),
      Review.countDocuments(filter),
    ]);

    res.json({
      success: true,
      count: items.length,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      data: items,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error fetching gig reviews' });
  }
};

// GET /api/reviews/:id
export const getReview = async (req: Request, res: Response) => {
  try {
    const doc = await Review.findById(req.params.id)
      .populate('student', 'name avatar')
      .populate('teacher', 'name avatar')
      .populate('gig', 'title');
    if (!doc) return res.status(404).json({ success: false, message: 'Review not found' });
    res.json({ success: true, data: doc });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error fetching review' });
  }
};

// GET /api/gigs/:gigId/reviews/me
export const getMyReviewForGig = async (req: Request, res: Response) => {
  try {
    const gigId = req.params.gigId;
    const studentId = (req.user as any)?._id;
    if (!studentId) return res.status(401).json({ success: false, message: 'Not authorized' });

    const doc = await Review.findOne({ gig: gigId, student: studentId });
    res.json({ success: true, data: doc || null });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error fetching review' });
  }
};

// POST /api/gigs/:gigId/reviews
export const createReview = async (req: Request, res: Response) => {
  try {
    if (!req.user || req.user.role !== 'student') {
      return res.status(403).json({ success: false, message: 'Only students can create reviews' });
    }

    const gigId = req.params.gigId || req.body.gig;
    if (!gigId) {
      return res.status(400).json({ success: false, message: 'gigId is required' });
    }

    const gig = await Gig.findById(gigId).select('_id teacher');
    if (!gig) return res.status(404).json({ success: false, message: 'Gig not found' });

    // Ensure the student has a completed booking for this gig
    const booking = await Booking.findOne({ gig: gig._id, student: req.user._id, status: 'completed' }).select('_id');
    if (!booking) {
      return res.status(400).json({ success: false, message: 'You can review only after the class is marked as completed for this gig' });
    }

    const { rating, title, comment } = req.body || {};
    const ratingNum = Number(rating);
    if (!Number.isFinite(ratingNum) || ratingNum < 1 || ratingNum > 5) {
      return res.status(400).json({ success: false, message: 'rating must be between 1 and 5' });
    }

    const payload: any = {
      gig: gig._id,
      teacher: gig.teacher,
      student: req.user._id,
      booking: booking._id,
      rating: ratingNum,
    };
    if (title) payload.title = String(title).trim();
    if (comment) payload.comment = String(comment).trim();

    const doc = await Review.create(payload);
    // Efficient updates: recompute gig ratings via aggregation (per-gig scope),
    // and incrementally update teacher aggregates.
    await Promise.all([
      recomputeGigRatings(String(gig._id)),
      incTeacherRating(String(gig.teacher), ratingNum, 1),
    ]);

    try {
      await logActivity({
        userId: (req as any)?.user?._id,
        action: 'review.create',
        targetType: 'Review',
        targetId: doc._id,
        metadata: { gigId: String(gig._id), teacherId: String(gig.teacher), rating: ratingNum },
        req,
      });
    } catch (e) {
      console.warn('[Activity] logActivity failed (non-critical):', (e as any)?.message);
    }

    res.status(201).json({ success: true, data: doc });
  } catch (err: any) {
    if (err?.code === 11000) {
      return res.status(400).json({ success: false, message: 'You have already reviewed this gig' });
    }
    console.error('createReview error:', err);
    res.status(500).json({ success: false, message: 'Error creating review' });
  }
};

// PUT /api/reviews/:id
export const updateReview = async (req: Request, res: Response) => {
  try {
    const doc = await Review.findById(req.params.id);
    if (!doc) return res.status(404).json({ success: false, message: 'Review not found' });

    if (!req.user || String(doc.student) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Not authorized to update this review' });
    }

    const update: any = {};
    let delta = 0;
    if (req.body.rating !== undefined) {
      const ratingNum = Number(req.body.rating);
      if (!Number.isFinite(ratingNum) || ratingNum < 1 || ratingNum > 5) {
        return res.status(400).json({ success: false, message: 'rating must be between 1 and 5' });
      }
      update.rating = ratingNum;
      delta = ratingNum - (doc as any).rating;
    }
    if (req.body.title !== undefined) update.title = String(req.body.title).trim();
    if (req.body.comment !== undefined) update.comment = String(req.body.comment).trim();

    const updated = await Review.findByIdAndUpdate(doc._id, update, { new: true });
    await recomputeGigRatings(String(doc.gig));
    if (delta !== 0) {
      await incTeacherRating((doc as any).teacher, delta, 0);
    }

    try {
      await logActivity({
        userId: (req as any)?.user?._id,
        action: 'review.update',
        targetType: 'Review',
        targetId: updated?._id || doc._id,
        metadata: { changed: Object.keys(update), delta },
        req,
      });
    } catch (e) {
      console.warn('[Activity] logActivity failed (non-critical):', (e as any)?.message);
    }

    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error updating review' });
  }
};

// PUT /api/reviews/:id/reply - Teacher replies to a review
export const replyToReview = async (req: Request, res: Response) => {
  try {
    const doc = await Review.findById(req.params.id);
    if (!doc) return res.status(404).json({ success: false, message: 'Review not found' });

    // Only the teacher of this gig can reply
    if (!req.user || req.user.role !== 'teacher') {
      return res.status(403).json({ success: false, message: 'Only teachers can reply to reviews' });
    }

    if (String(doc.teacher) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: 'You can only reply to reviews on your own gigs' });
    }

    const { reply } = req.body || {};
    if (!reply || typeof reply !== 'string' || !reply.trim()) {
      return res.status(400).json({ success: false, message: 'Reply text is required' });
    }

    const updated = await Review.findByIdAndUpdate(
      doc._id,
      { teacherReply: reply.trim(), teacherReplyAt: new Date() },
      { new: true }
    );

    try {
      await logActivity({
        userId: req.user._id,
        action: 'review.reply',
        targetType: 'Review',
        targetId: doc._id,
        metadata: { gigId: String(doc.gig) },
        req,
      });
    } catch (e) {
      console.warn('[Activity] logActivity failed (non-critical):', (e as any)?.message);
    }

    res.json({ success: true, data: updated });
  } catch (err) {
    console.error('replyToReview error:', err);
    res.status(500).json({ success: false, message: 'Error replying to review' });
  }
};

// DELETE /api/reviews/:id
export const deleteReview = async (req: Request, res: Response) => {
  try {
    const doc = await Review.findById(req.params.id);
    if (!doc) return res.status(404).json({ success: false, message: 'Review not found' });

    const isOwner = req.user && String(doc.student) === String(req.user._id);
    const isAdmin = req.user && req.user.role === 'admin';
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this review' });
    }

    await doc.deleteOne();
    await Promise.all([
      recomputeGigRatings(String(doc.gig)),
      incTeacherRating((doc as any).teacher, -((doc as any).rating || 0), -1),
    ]);

    try {
      await logActivity({
        userId: (req as any)?.user?._id,
        action: 'review.delete',
        targetType: 'Review',
        targetId: doc._id,
        metadata: { gigId: String((doc as any).gig) },
        req,
      });
    } catch (e) {
      console.warn('[Activity] logActivity failed (non-critical):', (e as any)?.message);
    }

    res.json({ success: true, data: {} });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error deleting review' });
  }
};
