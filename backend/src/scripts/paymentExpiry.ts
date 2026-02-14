import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// Configuration
const PAYMENT_SUBMISSION_WINDOW_HOURS = parseInt(process.env.PAYMENT_SUBMISSION_WINDOW_HOURS || '12', 10);
const VERIFICATION_WINDOW_HOURS = parseInt(process.env.VERIFICATION_WINDOW_HOURS || '24', 10);

/**
 * Expire manual payments that have exceeded their time windows.
 * This can be run as a cron job or called periodically.
 */
export async function expireStalePayments(): Promise<{ submissionExpired: number; verificationExpired: number }> {
  const Booking = require('../models/Booking').default;
  const now = new Date();

  let submissionExpired = 0;
  let verificationExpired = 0;

  // 1. Expire bookings where payment is pending_manual and submission window has passed
  const submissionWindowMs = PAYMENT_SUBMISSION_WINDOW_HOURS * 60 * 60 * 1000;
  const pendingBookings = await Booking.find({
    'manualPayment.status': 'pending_manual',
    'manualPayment.acceptedAt': { $exists: true },
  });

  for (const booking of pendingBookings) {
    const acceptedAt = new Date(booking.manualPayment.acceptedAt).getTime();
    if (now.getTime() > acceptedAt + submissionWindowMs) {
      const prevStatus = booking.manualPayment.status;
      booking.manualPayment.status = 'expired';
      if (!booking.paymentAuditLog) booking.paymentAuditLog = [];
      booking.paymentAuditLog.push({
        action: 'payment.expired',
        fromStatus: prevStatus,
        toStatus: 'expired',
        performedBy: null,
        note: 'Submission window expired (cron)',
        timestamp: now,
      });
      await booking.save();
      submissionExpired++;
    }
  }

  // 2. Expire bookings where payment is submitted and verification window has passed
  const verificationWindowMs = VERIFICATION_WINDOW_HOURS * 60 * 60 * 1000;
  const submittedBookings = await Booking.find({
    'manualPayment.status': 'submitted',
    'manualPayment.submittedAt': { $exists: true },
  });

  for (const booking of submittedBookings) {
    const submittedAt = new Date(booking.manualPayment.submittedAt).getTime();
    if (now.getTime() > submittedAt + verificationWindowMs) {
      const prevStatus = booking.manualPayment.status;
      booking.manualPayment.status = 'expired';
      if (!booking.paymentAuditLog) booking.paymentAuditLog = [];
      booking.paymentAuditLog.push({
        action: 'payment.expired',
        fromStatus: prevStatus,
        toStatus: 'expired',
        performedBy: null,
        note: 'Verification window expired (cron)',
        timestamp: now,
      });
      await booking.save();
      verificationExpired++;
    }
  }

  return { submissionExpired, verificationExpired };
}

// Run as standalone script
if (require.main === module) {
  (async () => {
    try {
      await mongoose.connect(process.env.MONGODB_URI!);
      console.log('Connected to MongoDB');

      const result = await expireStalePayments();
      console.log('Payment expiry complete:', result);

      await mongoose.disconnect();
      process.exit(0);
    } catch (err) {
      console.error('Error running payment expiry:', err);
      process.exit(1);
    }
  })();
}
