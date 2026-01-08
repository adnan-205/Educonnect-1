import express from 'express';
import {
  getMyPaymentInfo,
  upsertMyPaymentInfo,
  getManualPaymentInfo,
  submitPaymentProof,
  verifyPayment,
  rejectPayment,
  joinClass,
  getPaymentStatus,
} from '../controllers/manualPayment';
import { protect, authorize } from '../middleware/auth';

const router = express.Router();

// All routes require authentication
router.use(protect);

// ============================================
// Teacher Payment Info Routes
// ============================================

// GET /api/teachers/me/payment-info - Get teacher's own payment info
router.get('/teachers/me/payment-info', authorize('teacher'), getMyPaymentInfo);

// PUT /api/teachers/me/payment-info - Upsert teacher's payment info
router.put('/teachers/me/payment-info', authorize('teacher'), upsertMyPaymentInfo);

// ============================================
// Booking Payment Routes
// ============================================

// GET /api/bookings/:id/manual-payment-info - Get payment info for a booking (student/teacher)
router.get('/bookings/:id/manual-payment-info', getManualPaymentInfo);

// POST /api/bookings/:id/payment/submit - Submit payment proof (student only)
router.post('/bookings/:id/payment/submit', authorize('student'), submitPaymentProof);

// POST /api/bookings/:id/payment/verify - Verify payment (teacher only)
router.post('/bookings/:id/payment/verify', authorize('teacher'), verifyPayment);

// POST /api/bookings/:id/payment/reject - Reject payment (teacher only)
router.post('/bookings/:id/payment/reject', authorize('teacher'), rejectPayment);

// GET /api/bookings/:id/payment/status - Get payment status (student/teacher)
router.get('/bookings/:id/payment/status', getPaymentStatus);

// GET /api/bookings/:id/join - Get meeting details (gated by payment verification)
router.get('/bookings/:id/join', joinClass);

export default router;
