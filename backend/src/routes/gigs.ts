import express from 'express';
import {
  getGigs,
  getGig,
  createGig,
  updateGig,
  deleteGig,
} from '../controllers/gigs';
import { protect, authorize } from '../middleware/auth';
import { getGigReviews, getMyReviewForGig, createReview } from '../controllers/reviews';

const router = express.Router();

router
  .route('/')
  .get(getGigs)
  .post(protect, authorize('teacher'), createGig);

router
  .route('/:id')
  .get(getGig)
  .put(protect, authorize('teacher'), updateGig)
  .delete(protect, authorize('teacher'), deleteGig);

// Nested review routes for a gig
router.get('/:gigId/reviews', getGigReviews);
router.get('/:gigId/reviews/me', protect, getMyReviewForGig);
router.post('/:gigId/reviews', protect, authorize('student'), createReview);

export default router;
