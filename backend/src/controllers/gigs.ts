import { Request, Response } from 'express';
import Gig from '../models/Gig';
import Payment from '../models/Payment';
import { logActivity } from '../utils/activityLogger';
import { isValidCategory, ALLOWED_CATEGORIES } from '../constants/categories';

// Get all gigs with ranking-based sorting (like Upwork/Fiverr)
export const getGigs = async (req: Request, res: Response) => {
  try {
    const { category, sort, page = 1, limit = 50 } = req.query;
    const filter: any = {};
    
    // Filter by category if provided and valid
    if (category && typeof category === 'string') {
      const trimmedCategory = category.trim();
      if (trimmedCategory.length > 0) {
        // Escape regex special characters for safe matching
        const escapedCategory = trimmedCategory.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        filter.category = { $regex: new RegExp(`^${escapedCategory}$`, 'i') };
        console.log(`[Gigs] Filtering by category: "${trimmedCategory}"`);
      } else {
        console.log('[Gigs] Category parameter is empty after trimming, showing all gigs');
      }
    } else {
      console.log('[Gigs] No category filter provided, showing all gigs');
    }

    // Check and clear expired promotions (promotedUntil < now)
    await Gig.updateMany(
      { isPromoted: true, promotedUntil: { $lt: new Date() } },
      { $set: { isPromoted: false, promotedUntil: null } }
    );

    // Default sort: Featured first, then Promoted, then by rankingScore, then by rating
    let sortOption: any = {
      isFeatured: -1,
      isPromoted: -1,
      rankingScore: -1,
      averageRating: -1,
      completedBookingsCount: -1,
      createdAt: -1,
    };

    // Allow custom sort options
    if (sort === 'newest') {
      sortOption = { createdAt: -1 };
    } else if (sort === 'price_low') {
      sortOption = { price: 1, rankingScore: -1 };
    } else if (sort === 'price_high') {
      sortOption = { price: -1, rankingScore: -1 };
    } else if (sort === 'rating') {
      sortOption = { averageRating: -1, reviewsCount: -1, rankingScore: -1 };
    } else if (sort === 'popular') {
      sortOption = { completedBookingsCount: -1, averageRating: -1, rankingScore: -1 };
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [gigs, total] = await Promise.all([
      Gig.find(filter)
        .populate('teacher', 'name email avatar teacherRatingAverage')
        .sort(sortOption)
        .skip(skip)
        .limit(Number(limit)),
      Gig.countDocuments(filter),
    ]);

    res.json({
      success: true,
      count: gigs.length,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / Number(limit)),
      data: gigs,
    });
  } catch (err) {
    console.error('getGigs error:', err);
    res.status(500).json({
      success: false,
      message: 'Error fetching gigs',
    });
  }
};

// Get single gig
export const getGig = async (req: Request, res: Response) => {
  try {
    const gig = await Gig.findById(req.params.id).populate('teacher', 'name email');
    if (!gig) {
      return res.status(404).json({
        success: false,
        message: 'Gig not found',
      });
    }
    // Derive payment status for current student if authenticated
    let isPaid = false;
    if (req.user && req.user.role === 'student') {
      const payment = await Payment.findOne({ gigId: gig._id, studentId: req.user._id, status: 'SUCCESS' }).select('_id');
      isPaid = !!payment;
    }
    res.json({
      success: true,
      data: {
        ...gig.toObject(),
        isPaid,
      },
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Error fetching gig',
    });
  }
};

// Create new gig
export const createGig = async (req: Request, res: Response) => {
  try {
    // Basic validation & coercion
    const { title, description, price, category, duration, thumbnailUrl } = req.body || {};

    if (!title || !description || !category) {
      return res.status(400).json({ success: false, message: 'Validation failed', errors: ['title, description, and category are required'] });
    }
    if (!isValidCategory(String(category))) {
      return res.status(400).json({ success: false, message: 'Validation failed', errors: [`Invalid category. Allowed: ${ALLOWED_CATEGORIES.join(', ')}`] });
    }
    const priceNum = Number(price);
    const durationNum = Number(duration);
    if (!Number.isFinite(priceNum) || priceNum <= 0) {
      return res.status(400).json({ success: false, message: 'Validation failed', errors: ['price must be a positive number'] });
    }
    if (!Number.isFinite(durationNum) || durationNum <= 0) {
      return res.status(400).json({ success: false, message: 'Validation failed', errors: ['duration must be a positive number (minutes)'] });
    }

    const payload: any = {
      teacher: req.user._id,
      title: String(title).trim(),
      description: String(description).trim(),
      category: String(category).trim(),
      price: priceNum,
      duration: durationNum,
    };
    if (thumbnailUrl) payload.thumbnailUrl = thumbnailUrl;

    const gig = await Gig.create(payload);

    try {
      await logActivity({
        userId: (req as any)?.user?._id,
        action: 'gig.create',
        targetType: 'Gig',
        targetId: gig._id,
        metadata: { title: payload.title, price: payload.price, duration: payload.duration, category: payload.category },
        req,
      });
    } catch {}
    res.status(201).json({
      success: true,
      data: gig,
    });
  } catch (err) {
    // Return validation errors if present
    if ((err as any)?.name === 'ValidationError') {
      const errors = Object.values((err as any).errors || {}).map((e: any) => e?.message || String(e));
      return res.status(400).json({ success: false, message: 'Validation failed', errors });
    }
    console.error('Create gig error:', err);
    res.status(500).json({
      success: false,
      message: 'Error creating gig',
      details: (err as any)?.message || undefined,
    });
  }
};

// Update gig
export const updateGig = async (req: Request, res: Response) => {
  try {
    let gig = await Gig.findById(req.params.id);
    if (!gig) {
      return res.status(404).json({
        success: false,
        message: 'Gig not found',
      });
    }

    // Make sure user owns gig
    if (gig.teacher.toString() !== req.user._id.toString()) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to update this gig',
      });
    }

    const updateDoc = req.body;
    // Validate category if being updated
    if (updateDoc.category && !isValidCategory(String(updateDoc.category))) {
      return res.status(400).json({ success: false, message: 'Validation failed', errors: [`Invalid category. Allowed: ${ALLOWED_CATEGORIES.join(', ')}`] });
    }
    gig = await Gig.findByIdAndUpdate(req.params.id, updateDoc, {
      new: true,
      runValidators: true,
    });

    try {
      await logActivity({
        userId: (req as any)?.user?._id,
        action: 'gig.update',
        targetType: 'Gig',
        targetId: gig?._id,
        metadata: { updateKeys: Object.keys(updateDoc || {}) },
        req,
      });
    } catch {}
    res.json({
      success: true,
      data: gig,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Error updating gig',
    });
  }
};

// Delete gig
export const deleteGig = async (req: Request, res: Response) => {
  try {
    const gig = await Gig.findById(req.params.id);
    if (!gig) {
      return res.status(404).json({
        success: false,
        message: 'Gig not found',
      });
    }

    // Make sure user owns gig
    if (gig.teacher.toString() !== req.user._id.toString()) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to delete this gig',
      });
    }

    await gig.deleteOne();

    try {
      await logActivity({
        userId: (req as any)?.user?._id,
        action: 'gig.delete',
        targetType: 'Gig',
        targetId: gig._id,
        metadata: { title: (gig as any)?.title },
        req,
      });
    } catch {}

    res.json({
      success: true,
      data: {},
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Error deleting gig',
    });
  }
};
