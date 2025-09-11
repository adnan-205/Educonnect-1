import express from 'express';
import { getUser, getUserGigs, updateMe } from '../controllers/users';
import { protect } from '../middleware/auth';

const router = express.Router();

// Public routes for viewing user profile and gigs
router.get('/:id', getUser);
router.get('/:id/gigs', getUserGigs);

// Protected
router.put('/me', protect, updateMe);

export default router;
