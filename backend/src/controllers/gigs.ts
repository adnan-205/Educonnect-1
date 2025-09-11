import { Request, Response } from 'express';
import Gig from '../models/Gig';

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
    res.json({
      success: true,
      data: gig,
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
    req.body.teacher = req.user._id;
    const gig = await Gig.create(req.body);
    res.status(201).json({
      success: true,
      data: gig,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Error creating gig',
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
