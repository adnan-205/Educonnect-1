import { Request, Response } from 'express';
import User from '../models/User';
import Gig from '../models/Gig';

// GET /api/users/:id - public profile basics
export const getUser = async (req: Request, res: Response) => {
  try {
    const user = await User.findById(req.params.id)
      .select('name email role profile createdAt avatar coverImage');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({ success: true, data: user });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error fetching user' });
  }
};

// GET /api/users/:id/gigs - public gigs for a teacher
export const getUserGigs = async (req: Request, res: Response) => {
  try {
    const user = await User.findById(req.params.id).select('_id role');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const gigs = await Gig.find({ teacher: user._id })
      .select('title price category duration thumbnailUrl createdAt');

    res.json({ success: true, count: gigs.length, data: gigs });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error fetching user gigs' });
  }
};

// PUT /api/users/me - update own basic profile (avatar, coverImage, profile.bio/education/experience)
export const updateMe = async (req: Request, res: Response) => {
  try {
    const authUser: any = (req as any).user;
    const userId = authUser?._id || authUser?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Not authorized' });
    }

    const patch: any = {};
    if (typeof req.body.avatar === 'string') patch.avatar = req.body.avatar;
    if (typeof req.body.coverImage === 'string') patch.coverImage = req.body.coverImage;
    if (req.body.profile && typeof req.body.profile === 'object') {
      patch.profile = {
        bio: req.body.profile.bio,
        education: req.body.profile.education,
        experience: req.body.profile.experience,
      };
    }

    const updated = await User.findByIdAndUpdate(userId, patch, { new: true })
      .select('name email role profile avatar coverImage');

    res.json({ success: true, data: updated });
  } catch (err) {
    console.error('updateMe error:', err);
    res.status(500).json({ success: false, message: 'Error updating profile' });
  }
};
