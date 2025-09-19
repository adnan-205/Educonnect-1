import express from 'express';
import {
  getBookings,
  getBooking,
  createBooking,
  updateBookingStatus,
  getTeacherDashboardStats,
} from '../controllers/bookings';
import { protect, authorize } from '../middleware/auth';

const router = express.Router();

// Protect all routes
router.use(protect);

router
  .route('/')
  .get(getBookings)
  .post(authorize('student'), createBooking);

router
  .route('/dashboard/stats')
  .get(authorize('teacher'), getTeacherDashboardStats);

router
  .route('/:id')
  .get(getBooking)
  .put(authorize('teacher'), updateBookingStatus);

export default router;
