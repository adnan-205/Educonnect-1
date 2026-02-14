import express from 'express';
import { protect } from '../middleware/auth';
import {
  initPayment,
  successPayment,
  failPayment,
  cancelPayment,
  ipnListener,
  getPaymentStatus,
  getPaymentStatusForBooking,
  batchGetBookingPaymentStatus,
} from '../controllers/payments';

const router = express.Router();

// Initialize payment requires auth
router.post('/init', protect, initPayment);

// Check payment status for current student and a gig
router.get('/status/:gigId', protect, getPaymentStatus);

// Check payment status for a specific booking (student or teacher)
router.get('/booking-status/:bookingId', protect, getPaymentStatusForBooking);

// Batch check payment status for multiple bookings (eliminates N+1)
router.post('/booking-status/batch', protect, batchGetBookingPaymentStatus);

// SSLCommerz callbacks (do not require auth)
router.post('/success/:tran_id', successPayment);
router.post('/fail/:tran_id', failPayment);
router.post('/cancel/:tran_id', cancelPayment);

// IPN listener (server to server)
router.post('/ipn', ipnListener);

export default router;
