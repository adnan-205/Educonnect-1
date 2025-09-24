import express from 'express';
import {
  getBookings,
  getBooking,
  createBooking,
  updateBookingStatus,
} from '../controllers/bookings';
import { protect, authorize } from '../middleware/auth';
import { validateBookingCreation } from '../middleware/validation';

const router = express.Router();

// Protect all routes
router.use(protect);

router
  .route('/')
  .get(getBookings)
  .post(authorize('student'), validateBookingCreation, createBooking);

router
  .route('/:id')
  .get(getBooking)
  .put(authorize('teacher'), updateBookingStatus);

export default router;
