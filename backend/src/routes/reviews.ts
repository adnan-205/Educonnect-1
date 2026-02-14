import express from 'express';
import { getReviews, getReview, updateReview, deleteReview, replyToReview, batchCheckReviewStatus } from '../controllers/reviews';
import { protect } from '../middleware/auth';

const router = express.Router();

// List & filter reviews
router.get('/', getReviews);

// Batch check review status for multiple gigs (must be before /:id)
router.post('/batch-status', protect, batchCheckReviewStatus);

// Single review
router.get('/:id', getReview);

// Update own review
router.put('/:id', protect, updateReview);

// Teacher reply to a review
router.put('/:id/reply', protect, replyToReview);

// Delete (owner or admin handled in controller)
router.delete('/:id', protect, deleteReview);

export default router;
