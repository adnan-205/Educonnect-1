import express from 'express';
import { getReviews, getReview, updateReview, deleteReview } from '../controllers/reviews';
import { protect } from '../middleware/auth';

const router = express.Router();

// List & filter reviews
router.get('/', getReviews);

// Single review
router.get('/:id', getReview);

// Update own review
router.put('/:id', protect, updateReview);

// Delete (owner or admin handled in controller)
router.delete('/:id', protect, deleteReview);

export default router;
