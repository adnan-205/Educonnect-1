import express from 'express';
import {
  getBookings,
  getBooking,
  createBooking,
  updateBookingStatus,
  getBookingByRoom,
  markAttendance,
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

// Access a meeting by room id (student or teacher only)
router.get('/room/:roomId', getBookingByRoom);

router
  .route('/:id')
  .get(getBooking)
  .put(authorize('teacher'), updateBookingStatus);

// Student marks attendance for a booking they own
router.post('/:id/attendance', markAttendance);

export default router;
