import express from 'express';
import {
  upsertTeacherPaymentInfo,
  getMyPaymentInfo,
  getTeacherPaymentInfo,
  submitPaymentProof,
  verifyPayment,
  rejectPayment,
  getJoinDetails,
  getPaymentStatus,
} from '../controllers/manualPayment';
import { protect, authorize } from '../middleware/auth';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Teacher payment info routes
router.put('/teachers/me/payment-info', authorize('teacher'), upsertTeacherPaymentInfo);
router.get('/teachers/me/payment-info', authorize('teacher'), getMyPaymentInfo);
router.get('/teachers/:teacherId/payment-info', getTeacherPaymentInfo);

// Booking payment routes
router.post('/bookings/:id/payment/submit', authorize('student'), submitPaymentProof);
router.post('/bookings/:id/payment/verify', authorize('teacher'), verifyPayment);
router.post('/bookings/:id/payment/reject', authorize('teacher'), rejectPayment);
router.get('/bookings/:id/payment-status', getPaymentStatus);
router.get('/bookings/:id/join', getJoinDetails);

export default router;
