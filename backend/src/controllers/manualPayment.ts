import { Request, Response } from 'express';
import Booking from '../models/Booking';
import Gig from '../models/Gig';
import TeacherPaymentInfo from '../models/TeacherPaymentInfo';
import PaymentTrxRegistry from '../models/PaymentTrxRegistry';
import { logActivity } from '../utils/activityLogger';

// Configuration constants (could be moved to env)
const PAYMENT_SUBMISSION_WINDOW_HOURS = parseInt(process.env.PAYMENT_SUBMISSION_WINDOW_HOURS || '12', 10);
const VERIFICATION_WINDOW_HOURS = parseInt(process.env.VERIFICATION_WINDOW_HOURS || '24', 10);
const MAX_SUBMISSION_COUNT = parseInt(process.env.MAX_PAYMENT_SUBMISSIONS || '3', 10);

// Helper to add audit log entry
const addAuditLog = (booking: any, action: string, fromStatus: string | undefined, toStatus: string, performedBy: string, note?: string) => {
  if (!booking.paymentAuditLog) {
    booking.paymentAuditLog = [];
  }
  booking.paymentAuditLog.push({
    action,
    fromStatus,
    toStatus,
    performedBy,
    note,
    timestamp: new Date(),
  });
};

// ============================================
// Teacher Payment Info Endpoints
// ============================================

// PUT /api/teachers/me/payment-info
export const upsertTeacherPaymentInfo = async (req: Request, res: Response) => {
  try {
    if (req.user.role !== 'teacher') {
      return res.status(403).json({ success: false, message: 'Only teachers can set payment info' });
    }

    const { bkashNumber, nagadNumber, bankDetails, accountName, instructions } = req.body;

    const paymentInfo = await TeacherPaymentInfo.findOneAndUpdate(
      { teacherId: req.user._id },
      {
        teacherId: req.user._id,
        bkashNumber,
        nagadNumber,
        bankDetails,
        accountName,
        instructions,
      },
      { upsert: true, new: true, runValidators: true }
    );

    await logActivity({
      userId: req.user._id,
      action: 'teacher.paymentInfo.update',
      targetType: 'TeacherPaymentInfo',
      targetId: String(paymentInfo._id),
      metadata: {},
      req,
    });

    return res.json({ success: true, data: paymentInfo });
  } catch (err: any) {
    console.error('Error upserting teacher payment info:', err);
    return res.status(500).json({ success: false, message: 'Failed to update payment info' });
  }
};

// GET /api/teachers/me/payment-info
export const getMyPaymentInfo = async (req: Request, res: Response) => {
  try {
    if (req.user.role !== 'teacher') {
      return res.status(403).json({ success: false, message: 'Only teachers can access their payment info' });
    }

    const paymentInfo = await TeacherPaymentInfo.findOne({ teacherId: req.user._id });
    return res.json({ success: true, data: paymentInfo || null });
  } catch (err: any) {
    console.error('Error fetching teacher payment info:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch payment info' });
  }
};

// GET /api/teachers/:teacherId/payment-info
export const getTeacherPaymentInfo = async (req: Request, res: Response) => {
  try {
    const { teacherId } = req.params;

    const paymentInfo = await TeacherPaymentInfo.findOne({ teacherId });
    if (!paymentInfo) {
      return res.status(404).json({ success: false, message: 'Teacher payment info not found' });
    }

    // Return safe subset for students (no bank account numbers in full)
    const safeData = {
      bkashNumber: paymentInfo.bkashNumber,
      nagadNumber: paymentInfo.nagadNumber,
      accountName: paymentInfo.accountName,
      instructions: paymentInfo.instructions,
      bankDetails: paymentInfo.bankDetails ? {
        bankName: paymentInfo.bankDetails.bankName,
        accountName: paymentInfo.bankDetails.accountName,
        // Mask account number for security
        accountNumber: paymentInfo.bankDetails.accountNumber
          ? `****${paymentInfo.bankDetails.accountNumber.slice(-4)}`
          : undefined,
        branchName: paymentInfo.bankDetails.branchName,
      } : undefined,
    };

    return res.json({ success: true, data: safeData });
  } catch (err: any) {
    console.error('Error fetching teacher payment info:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch teacher payment info' });
  }
};

// ============================================
// Payment Submission/Verification Endpoints
// ============================================

// POST /api/bookings/:id/payment/submit
export const submitPaymentProof = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { method, trxid, senderNumber, amountPaid, screenshotUrl } = req.body;

    // Validate required fields
    if (!method || !['bkash', 'nagad', 'bank'].includes(method)) {
      return res.status(422).json({ success: false, message: 'Invalid payment method' });
    }
    if (!trxid || typeof trxid !== 'string' || trxid.trim().length === 0) {
      return res.status(422).json({ success: false, message: 'Transaction ID is required' });
    }

    const booking = await Booking.findById(id).populate({
      path: 'gig',
      select: 'teacher price title',
    });

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    // Must be the booking's student
    if (booking.student.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Only the booking student can submit payment proof' });
    }

    // Booking must be accepted
    if (booking.status !== 'accepted') {
      return res.status(400).json({ success: false, message: 'Booking must be accepted before payment submission' });
    }

    // Must be using manual payment method
    if ((booking as any).paymentMethodType !== 'manual') {
      return res.status(400).json({ success: false, message: 'This booking does not use manual payment' });
    }

    const manualPayment = (booking as any).manualPayment || {};

    // Check payment status allows submission
    if (!['pending_manual', 'rejected'].includes(manualPayment.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot submit payment when status is ${manualPayment.status}`,
      });
    }

    // Check submission count limit
    if ((manualPayment.submissionCount || 0) >= MAX_SUBMISSION_COUNT) {
      return res.status(400).json({
        success: false,
        message: `Maximum ${MAX_SUBMISSION_COUNT} submissions reached. Please contact admin.`,
      });
    }

    // Check submission window (12 hours after acceptance)
    const acceptedAt = manualPayment.acceptedAt ? new Date(manualPayment.acceptedAt).getTime() : 0;
    if (acceptedAt) {
      const windowEnd = acceptedAt + PAYMENT_SUBMISSION_WINDOW_HOURS * 60 * 60 * 1000;
      if (Date.now() > windowEnd) {
        // Mark as expired
        const prevStatus = manualPayment.status;
        manualPayment.status = 'expired';
        addAuditLog(booking, 'payment.expired', prevStatus, 'expired', 'system', 'Submission window expired');
        await booking.save();
        return res.status(400).json({
          success: false,
          message: 'Payment submission window has expired',
        });
      }
    }

    // Check for duplicate trxid
    const gig = booking.gig as any;
    const teacherId = gig?.teacher?._id || gig?.teacher;

    try {
      await PaymentTrxRegistry.create({
        trxid: trxid.trim(),
        bookingId: booking._id,
        teacherId,
        studentId: req.user._id,
        amount: amountPaid || manualPayment.amountExpected || gig?.price || 0,
        method,
      });
    } catch (err: any) {
      if (err.code === 11000) {
        return res.status(409).json({
          success: false,
          message: 'This transaction ID has already been used. Please use a unique transaction ID.',
        });
      }
      throw err;
    }

    // Update booking with payment proof
    const prevStatus = manualPayment.status;
    (booking as any).manualPayment = {
      ...manualPayment,
      status: 'submitted',
      method,
      trxid: trxid.trim(),
      senderNumber: senderNumber?.trim() || undefined,
      amountPaid: amountPaid || manualPayment.amountExpected,
      screenshotUrl: screenshotUrl || undefined,
      submittedAt: new Date(),
      submissionCount: (manualPayment.submissionCount || 0) + 1,
      amountExpected: manualPayment.amountExpected,
      acceptedAt: manualPayment.acceptedAt,
    };

    addAuditLog(booking, 'payment.submitted', prevStatus, 'submitted', req.user._id.toString(), `TrxID: ${trxid.trim()}`);
    await booking.save();

    await logActivity({
      userId: req.user._id,
      action: 'booking.payment.submit',
      targetType: 'Booking',
      targetId: booking._id,
      metadata: { method, trxid: trxid.trim() },
      req,
    });

    return res.json({
      success: true,
      message: 'Payment proof submitted successfully. Waiting for teacher verification.',
      data: {
        bookingId: booking._id,
        paymentStatus: 'submitted',
        submissionCount: (booking as any).manualPayment.submissionCount,
      },
    });
  } catch (err: any) {
    console.error('Error submitting payment proof:', err);
    return res.status(500).json({ success: false, message: 'Failed to submit payment proof' });
  }
};

// POST /api/bookings/:id/payment/verify
export const verifyPayment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const booking = await Booking.findById(id).populate({
      path: 'gig',
      select: 'teacher title',
    });

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    // Must be the teacher of this gig
    const gig = booking.gig as any;
    const teacherId = gig?.teacher?._id || gig?.teacher;
    if (teacherId?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Only the gig teacher can verify payment' });
    }

    const manualPayment = (booking as any).manualPayment;
    if (!manualPayment || manualPayment.status !== 'submitted') {
      return res.status(400).json({
        success: false,
        message: 'Payment must be in submitted status to verify',
      });
    }

    // Update payment status
    const prevStatus = manualPayment.status;
    manualPayment.status = 'verified';
    manualPayment.verifiedAt = new Date();
    manualPayment.verifiedBy = req.user._id;
    (booking as any).joinUnlocked = true;

    addAuditLog(booking, 'payment.verified', prevStatus, 'verified', req.user._id.toString());
    await booking.save();

    await logActivity({
      userId: req.user._id,
      action: 'booking.payment.verify',
      targetType: 'Booking',
      targetId: booking._id,
      metadata: { trxid: manualPayment.trxid },
      req,
    });

    return res.json({
      success: true,
      message: 'Payment verified successfully. Student can now join the class.',
      data: {
        bookingId: booking._id,
        paymentStatus: 'verified',
        joinUnlocked: true,
      },
    });
  } catch (err: any) {
    console.error('Error verifying payment:', err);
    return res.status(500).json({ success: false, message: 'Failed to verify payment' });
  }
};

// POST /api/bookings/:id/payment/reject
export const rejectPayment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const booking = await Booking.findById(id).populate({
      path: 'gig',
      select: 'teacher title',
    });

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    // Must be the teacher of this gig
    const gig = booking.gig as any;
    const teacherId = gig?.teacher?._id || gig?.teacher;
    if (teacherId?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Only the gig teacher can reject payment' });
    }

    const manualPayment = (booking as any).manualPayment;
    if (!manualPayment || manualPayment.status !== 'submitted') {
      return res.status(400).json({
        success: false,
        message: 'Payment must be in submitted status to reject',
      });
    }

    // Update payment status
    const prevStatus = manualPayment.status;
    manualPayment.status = 'rejected';
    manualPayment.rejectedAt = new Date();
    manualPayment.rejectReason = reason || 'No reason provided';
    (booking as any).joinUnlocked = false;

    addAuditLog(booking, 'payment.rejected', prevStatus, 'rejected', req.user._id.toString(), reason);
    await booking.save();

    await logActivity({
      userId: req.user._id,
      action: 'booking.payment.reject',
      targetType: 'Booking',
      targetId: booking._id,
      metadata: { trxid: manualPayment.trxid, reason },
      req,
    });

    return res.json({
      success: true,
      message: 'Payment rejected. Student will be notified.',
      data: {
        bookingId: booking._id,
        paymentStatus: 'rejected',
        rejectReason: manualPayment.rejectReason,
        submissionCount: manualPayment.submissionCount,
        maxSubmissions: MAX_SUBMISSION_COUNT,
        canResubmit: manualPayment.submissionCount < MAX_SUBMISSION_COUNT,
      },
    });
  } catch (err: any) {
    console.error('Error rejecting payment:', err);
    return res.status(500).json({ success: false, message: 'Failed to reject payment' });
  }
};

// GET /api/bookings/:id/join
export const getJoinDetails = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const booking = await Booking.findById(id).populate({
      path: 'gig',
      select: 'teacher title duration price',
      populate: { path: 'teacher', select: 'name email avatar' },
    }).populate('student', 'name email');

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    // Must be student or teacher
    const gig = booking.gig as any;
    const teacherId = gig?.teacher?._id || gig?.teacher;
    const studentId = (booking.student as any)?._id || booking.student;
    const isTeacher = teacherId?.toString() === req.user._id.toString();
    const isStudent = studentId?.toString() === req.user._id.toString();

    if (!isTeacher && !isStudent) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    // Booking must be accepted
    if (booking.status !== 'accepted') {
      return res.status(403).json({
        success: false,
        message: 'Booking is not accepted yet',
        data: { status: booking.status },
      });
    }

    // Check payment status for manual payment bookings
    const paymentMethodType = (booking as any).paymentMethodType;
    if (paymentMethodType === 'manual') {
      const manualPayment = (booking as any).manualPayment;
      const joinUnlocked = (booking as any).joinUnlocked === true;

      if (!joinUnlocked || manualPayment?.status !== 'verified') {
        return res.status(403).json({
          success: false,
          message: 'Payment verification required to join',
          data: {
            paymentStatus: manualPayment?.status || 'pending_manual',
            paymentRequired: true,
            joinUnlocked: false,
          },
        });
      }
    }

    // For SSLCommerz payments, check existing Payment model (existing logic)
    // This keeps backwards compatibility
    if (paymentMethodType === 'sslcommerz' || paymentMethodType === 'none') {
      // Import Payment model inline to avoid circular deps
      const Payment = require('../models/Payment').default;
      const paid = await Payment.findOne({
        bookingId: booking._id,
        studentId: req.user._id,
        status: 'SUCCESS',
      }).select('_id');

      if (!paid && isStudent) {
        return res.status(402).json({
          success: false,
          message: 'Payment required to join this class',
          data: { paymentRequired: true },
        });
      }
    }

    // Enforce join window timing
    const scheduled = (booking as any).scheduledAt || (booking as any).scheduledDate;
    const startTs = new Date(scheduled).getTime();
    if (!startTs || isNaN(startTs)) {
      return res.status(400).json({ success: false, message: 'Invalid scheduled date/time' });
    }

    const durationMin = gig?.duration || 90;
    const windowOpen = startTs - 15 * 60 * 1000;
    const endTs = startTs + durationMin * 60 * 1000;
    const windowClose = endTs + 60 * 60 * 1000;
    const now = Date.now();

    if (now < windowOpen) {
      return res.status(403).json({
        success: false,
        message: 'Join window not open yet',
        data: { windowOpensAt: new Date(windowOpen).toISOString() },
      });
    }
    if (now > windowClose) {
      return res.status(403).json({
        success: false,
        message: 'Join window has closed for this class',
      });
    }

    // Return meeting details
    const meetingData = {
      bookingId: booking._id,
      meetingRoomId: (booking as any).meetingRoomId,
      meetingLink: (booking as any).meetingLink,
      meetingPassword: (booking as any).meetingPassword,
      roleForThisBooking: isTeacher ? 'teacher' : 'student',
      gig: {
        title: gig?.title,
        duration: gig?.duration,
      },
      scheduledAt: scheduled,
    };

    return res.json({ success: true, data: meetingData });
  } catch (err: any) {
    console.error('Error getting join details:', err);
    return res.status(500).json({ success: false, message: 'Failed to get join details' });
  }
};

// GET /api/bookings/:id/payment-status
export const getPaymentStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const booking = await Booking.findById(id).populate({
      path: 'gig',
      select: 'teacher title price',
      populate: { path: 'teacher', select: 'name email' },
    });

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    // Must be student or teacher
    const gig = booking.gig as any;
    const teacherId = gig?.teacher?._id || gig?.teacher;
    const studentId = booking.student;
    const isTeacher = teacherId?.toString() === req.user._id.toString();
    const isStudent = studentId?.toString() === req.user._id.toString();

    if (!isTeacher && !isStudent) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const manualPayment = (booking as any).manualPayment || {};
    const paymentMethodType = (booking as any).paymentMethodType || 'none';

    return res.json({
      success: true,
      data: {
        bookingId: booking._id,
        paymentMethodType,
        paymentRefCode: (booking as any).paymentRefCode,
        manualPayment: {
          status: manualPayment.status || 'pending_manual',
          method: manualPayment.method,
          amountExpected: manualPayment.amountExpected || gig?.price,
          amountPaid: manualPayment.amountPaid,
          trxid: manualPayment.trxid,
          submittedAt: manualPayment.submittedAt,
          verifiedAt: manualPayment.verifiedAt,
          rejectedAt: manualPayment.rejectedAt,
          rejectReason: manualPayment.rejectReason,
          submissionCount: manualPayment.submissionCount || 0,
          maxSubmissions: MAX_SUBMISSION_COUNT,
          canSubmit: ['pending_manual', 'rejected'].includes(manualPayment.status) &&
            (manualPayment.submissionCount || 0) < MAX_SUBMISSION_COUNT,
        },
        joinUnlocked: (booking as any).joinUnlocked === true,
        teacher: {
          _id: teacherId,
          name: gig?.teacher?.name,
        },
        gigPrice: gig?.price,
      },
    });
  } catch (err: any) {
    console.error('Error getting payment status:', err);
    return res.status(500).json({ success: false, message: 'Failed to get payment status' });
  }
};
