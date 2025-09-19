import { Request, Response } from 'express';
import User from '../models/User';
import Gig from '../models/Gig';

// GET /api/users/:id - public profile basics
export const getUser = async (req: Request, res: Response) => {
  try {
    const user = await User.findById(req.params.id)
      .select('name email role profile createdAt avatar coverImage phone location headline');

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

    const patch: Record<string, any> = {};

    // Top-level fields
    if (typeof req.body.name === 'string') patch['name'] = req.body.name;
    if (typeof req.body.headline === 'string') patch['headline'] = req.body.headline;
    if (typeof req.body.phone === 'string') patch['phone'] = req.body.phone;
    if (typeof req.body.location === 'string') patch['location'] = req.body.location;
    if (typeof req.body.avatar === 'string') patch['avatar'] = req.body.avatar;
    if (typeof req.body.coverImage === 'string') patch['coverImage'] = req.body.coverImage;

    // Onboarding fields
    if (typeof req.body.marketingSource === 'string') patch['marketingSource'] = req.body.marketingSource;
    if (typeof req.body.isOnboarded === 'boolean') patch['isOnboarded'] = req.body.isOnboarded;
    // Optional role update (limit to known roles)
    if (typeof req.body.role === 'string' && ['student','teacher','admin'].includes(req.body.role)) {
      patch['role'] = req.body.role;
    }

    // Nested profile fields via dot-notation (merges without wiping unspecified keys)
    const p = req.body.profile || {};
    if (p && typeof p === 'object') {
      if (p.bio !== undefined) patch['profile.bio'] = p.bio;
      if (p.experiences !== undefined) patch['profile.experiences'] = p.experiences;
      if (p.education !== undefined) patch['profile.education'] = p.education;
      if (p.work !== undefined) patch['profile.work'] = p.work;
      if (p.demoVideos !== undefined) patch['profile.demoVideos'] = p.demoVideos;
      if (p.skills !== undefined) patch['profile.skills'] = p.skills;
      if (p.languages !== undefined) patch['profile.languages'] = p.languages;
      if (p.subjects !== undefined) patch['profile.subjects'] = p.subjects;
      if (p.hourlyRate !== undefined) patch['profile.hourlyRate'] = p.hourlyRate;
      if (p.availability !== undefined) patch['profile.availability'] = p.availability;
      if (p.timezone !== undefined) patch['profile.timezone'] = p.timezone;
    }

    const updated = await User.findByIdAndUpdate(userId, { $set: patch }, { new: true })
      .select('name email role isOnboarded marketingSource profile avatar coverImage phone location headline');

    res.json({ success: true, data: updated });
  } catch (err) {
    console.error('updateMe error:', err);
    res.status(500).json({ success: false, message: 'Error updating profile' });
  }
};
