import { Request, Response } from 'express';
import Payment from '../models/Payment';
import Gig from '../models/Gig';
import Booking from '../models/Booking';
import paymentsService from '../services/payments.service';
import { logActivity } from '../utils/activityLogger';

// Initialize a payment and return the gateway URL
export const initPayment = async (req: Request, res: Response) => {
  try {
    const { gigId, bookingId } = req.body as { gigId: string; bookingId?: string };
    if (!gigId) {
      return res.status(400).json({ success: false, message: 'gigId is required' });
    }
    const studentId = req.user?._id;
    if (!studentId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const result = await paymentsService.initPayment({
      gigId,
      bookingId,
      studentId: studentId.toString(),
      studentName: (req.user as any)?.name,
      studentEmail: (req.user as any)?.email,
    });

    try {
      await logActivity({ userId: studentId, action: 'payment.init', targetType: 'Gig', targetId: gigId, metadata: { bookingId, url: result?.url }, req });
    } catch (e) { console.warn('[Activity] logActivity failed (non-critical):', (e as any)?.message); }
    return res.json({ success: true, ...result });
  } catch (error: any) {
    const errMsg = error?.response?.data?.failedreason || error?.message || 'Payment initialization failed';
    console.error('initPayment error:', errMsg);
    const body: any = { success: false, message: 'Payment initialization failed' };
    if (process.env.NODE_ENV !== 'production') body.reason = errMsg;
    return res.status(500).json(body);
  }
};

// Success callback handler (redirect from SSLCommerz)
export const successPayment = async (req: Request, res: Response) => {
  try {
    const { tran_id } = req.params as { tran_id: string };
    await paymentsService.handleSuccess(tran_id);

    const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
    try { await logActivity({ userId: (req as any)?.user?._id, action: 'payment.success', metadata: { tran_id }, req }); } catch (e) { console.warn('[Activity] logActivity failed (non-critical):', (e as any)?.message); }
    return res.redirect(`${FRONTEND_URL}/payment-success?tran_id=${encodeURIComponent(tran_id)}`);
  } catch (error) {
    console.error('successPayment error:', error);
    return res.status(500).json({ success: false, message: 'Error processing success callback' });
  }
};

// Failure callback handler (redirect from SSLCommerz)
export const failPayment = async (req: Request, res: Response) => {
  try {
    const { tran_id } = req.params as { tran_id: string };
    await paymentsService.handleFailure(tran_id);

    const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
    try { await logActivity({ userId: (req as any)?.user?._id, action: 'payment.fail', metadata: { tran_id }, req }); } catch (e) { console.warn('[Activity] logActivity failed (non-critical):', (e as any)?.message); }
    return res.redirect(`${FRONTEND_URL}/payment-failed`);
  } catch (error) {
    console.error('failPayment error:', error);
    return res.status(500).json({ success: false, message: 'Error processing failure callback' });
  }
};

// Cancel callback handler (optional)
export const cancelPayment = async (req: Request, res: Response) => {
  try {
    const { tran_id } = req.params as { tran_id: string };
    await paymentsService.handleCancel(tran_id);

    const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
    try { await logActivity({ userId: (req as any)?.user?._id, action: 'payment.cancel', metadata: { tran_id }, req }); } catch (e) { console.warn('[Activity] logActivity failed (non-critical):', (e as any)?.message); }
    return res.redirect(`${FRONTEND_URL}/payment-failed`);
  } catch (error) {
    console.error('cancelPayment error:', error);
    return res.status(500).json({ success: false, message: 'Error processing cancel callback' });
  }
};

// IPN listener (server-to-server confirmation)
export const ipnListener = async (req: Request, res: Response) => {
  try {
    const status = await paymentsService.handleIPN(req.body);
    try { await logActivity({ userId: null, action: 'payment.ipn', metadata: { status, body: req.body }, req }); } catch (e) { console.warn('[Activity] logActivity failed (non-critical):', (e as any)?.message); }
    return res.status(200).json({ success: true, message: 'IPN received', status });
  } catch (error) {
    console.error('IPN error:', error);
    return res.status(500).json({ success: false, message: 'IPN handling failed' });
  }
};

// Teacher or student can check payment status for a specific booking
export const getPaymentStatusForBooking = async (req: Request, res: Response) => {
  try {
    const { bookingId } = req.params as { bookingId: string };
    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const booking = await Booking.findById(bookingId).select('gig student');
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    // Allow if requester is the student of this booking or the teacher of the gig
    const gig = await Gig.findById(booking.gig).select('teacher');
    const isStudent = booking.student?.toString() === userId.toString();
    const isTeacher = gig?.teacher?.toString() === userId.toString();
    if (!isStudent && !isTeacher) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    // Enforce per-booking payment: a SUCCESS payment linked to this bookingId
    const payment = await Payment.findOne({ bookingId: booking._id, studentId: booking.student, status: 'SUCCESS' }).select('_id');
    return res.json({ success: true, paid: !!payment });
  } catch (error) {
    console.error('getPaymentStatusForBooking error:', error);
    return res.status(500).json({ success: false, message: 'Failed to check payment status' });
  }
};

// Check if current student has paid for a gig
export const getPaymentStatus = async (req: Request, res: Response) => {
  try {
    const { gigId } = req.params as { gigId: string };
    const studentId = req.user?._id;

    if (!studentId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    if (!gigId) {
      return res.status(400).json({ success: false, message: 'gigId is required' });
    }

    const payment = await Payment.findOne({ gigId, studentId, status: 'SUCCESS' }).select('_id');
    const isPaid = !!payment;

    return res.json({ success: true, paid: isPaid });
  } catch (error) {
    console.error('getPaymentStatus error:', error);
    return res.status(500).json({ success: false, message: 'Failed to check payment status' });
  }
};

// Batch check payment status for multiple bookings (eliminates N+1 queries)
export const batchGetBookingPaymentStatus = async (req: Request, res: Response) => {
  try {
    const { bookingIds } = req.body as { bookingIds: string[] };
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    if (!Array.isArray(bookingIds) || bookingIds.length === 0) {
      return res.status(400).json({ success: false, message: 'bookingIds array is required' });
    }

    // Limit to prevent abuse
    if (bookingIds.length > 100) {
      return res.status(400).json({ success: false, message: 'Maximum 100 bookingIds per request' });
    }

    // Get all bookings in one query
    const bookings = await Booking.find({ _id: { $in: bookingIds } })
      .select('_id gig student')
      .populate('gig', 'teacher')
      .lean();

    // Filter bookings user has access to (student or teacher)
    const accessibleBookingIds = bookings
      .filter((b: any) => {
        const isStudent = b.student?.toString() === userId.toString();
        const isTeacher = b.gig?.teacher?.toString() === userId.toString();
        return isStudent || isTeacher;
      })
      .map((b: any) => b._id.toString());

    // Get all payments for these bookings in one query
    const payments = await Payment.find({
      bookingId: { $in: accessibleBookingIds },
      status: 'SUCCESS'
    }).select('bookingId').lean();

    // Build result map
    const paidSet = new Set(payments.map((p: any) => p.bookingId.toString()));
    const result: Record<string, boolean> = {};
    
    for (const bookingId of bookingIds) {
      if (accessibleBookingIds.includes(bookingId)) {
        result[bookingId] = paidSet.has(bookingId);
      } else {
        result[bookingId] = false; // No access or not found
      }
    }

    return res.json({ success: true, data: result });
  } catch (error) {
    console.error('batchGetBookingPaymentStatus error:', error);
    return res.status(500).json({ success: false, message: 'Failed to check payment statuses' });
  }
};
