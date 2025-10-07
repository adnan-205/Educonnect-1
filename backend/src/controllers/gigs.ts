import { Request, Response } from 'express';
import Gig from '../models/Gig';
import Payment from '../models/Payment';

// Get all gigs
export const getGigs = async (req: Request, res: Response) => {
  try {
    const gigs = await Gig.find().populate('teacher', 'name email');
    res.json({
      success: true,
      count: gigs.length,
      data: gigs,
    });
  } catch (err) {
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

    gig = await Gig.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

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
