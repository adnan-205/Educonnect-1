import express from 'express';
import {
  getGigs,
  getGig,
  createGig,
  updateGig,
  deleteGig,
} from '../controllers/gigs';
import { protect, authorize } from '../middleware/auth';

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

export default router;
