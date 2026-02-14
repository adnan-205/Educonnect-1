import express from 'express';
import { getUser, getUserGigs, updateMe, getUsersBulk } from '../controllers/users';
import { protect } from '../middleware/auth';

const router = express.Router();

// Bulk fetch users by IDs (must be before /:id to avoid route conflict)
router.post('/bulk', getUsersBulk);

// Public routes for viewing user profile and gigs
router.get('/:id', getUser);
router.get('/:id/gigs', getUserGigs);

// Protected
router.put('/me', protect, updateMe);

export default router;
