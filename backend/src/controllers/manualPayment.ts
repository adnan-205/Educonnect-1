import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Booking from '../models/Booking';
import Gig from '../models/Gig';
import TeacherPaymentInfo from '../models/TeacherPaymentInfo';
import PaymentTrxRegistry from '../models/PaymentTrxRegistry';
import { logActivity } from '../utils/activityLogger';

// Configuration (can be moved to env)
const PAYMENT_SUBMISSION_WINDOW_HOURS = parseInt(process.env.PAYMENT_SUBMISSION_WINDOW_HOURS || '12', 10);
const PAYMENT_VERIFICATION_WINDOW_HOURS = parseInt(process.env.PAYMENT_VERIFICATION_WINDOW_HOURS || '24', 10);
const MAX_SUBMISSION_COUNT = parseInt(process.env.MAX_PAYMENT_SUBMISSIONS || '3', 10);

// Helper to check if payment submission window is expired
const isSubmissionWindowExpired = (acceptedAt: Date | undefined): boolean => {
  if (!acceptedAt) return false;
  const windowEnd = new Date(acceptedAt.getTime() + PAYMENT_SUBMISSION_WINDOW_HOURS * 60 * 60 * 1000);
  return new Date() > windowEnd;
};

// Helper to check if verification window is expired
const isVerificationWindowExpired = (submittedAt: Date | undefined): boolean => {
  if (!submittedAt) return false;
  const windowEnd = new Date(submittedAt.getTime() + PAYMENT_VERIFICATION_WINDOW_HOURS * 60 * 60 * 1000);
  return new Date() > windowEnd;
};

// Helper to add audit log entry
const addAuditLog = (booking: any, action: string, fromStatus: string | undefined, toStatus: string, performedBy: string, note?: string) => {
  if (!booking.paymentAuditLog) {
    booking.paymentAuditLog = [];
  }
  booking.paymentAuditLog.push({
    action,
    fromStatus,
    toStatus,
    performedBy: new mongoose.Types.ObjectId(performedBy),
    note,
    timestamp: new Date(),
  });
};

// ============================================
// Teacher Payment Info Endpoints
// ============================================

// GET /api/teachers/me/payment-info
export const getMyPaymentInfo = async (req: Request, res: Response) => {
  try {
    if (req.user.role !== 'teacher') {
      return res.status(403).json({ success: false, message: 'Only teachers can access payment info' });
    }

    const info = await TeacherPaymentInfo.findOne({ teacherId: req.user._id });
    return res.json({
      success: true,
      data: info || null,
    });
  } catch (err) {
    console.error('Error fetching teacher payment info:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch payment info' });
  }
};

// PUT /api/teachers/me/payment-info
export const upsertMyPaymentInfo = async (req: Request, res: Response) => {
  try {
    if (req.user.role !== 'teacher') {
      return res.status(403).json({ success: false, message: 'Only teachers can update payment info' });
    }

    const {
      bkashNumber,
      nagadNumber,
      bankAccountName,
      bankAccountNumber,
      bankName,
      bankBranch,
      routingNumber,
      instructions,
    } = req.body;

    // Validate at least one payment method is provided
    const hasAnyMethod = bkashNumber || nagadNumber || (bankAccountNumber && bankName);
    if (!hasAnyMethod) {
      return res.status(422).json({
        success: false,
        message: 'Please provide at least one payment method (bKash, Nagad, or Bank details)',
      });
    }

    const info = await TeacherPaymentInfo.findOneAndUpdate(
      { teacherId: req.user._id },
      {
        teacherId: req.user._id,
        bkashNumber: bkashNumber?.trim() || undefined,
        nagadNumber: nagadNumber?.trim() || undefined,
        bankAccountName: bankAccountName?.trim() || undefined,
        bankAccountNumber: bankAccountNumber?.trim() || undefined,
        bankName: bankName?.trim() || undefined,
        bankBranch: bankBranch?.trim() || undefined,
        routingNumber: routingNumber?.trim() || undefined,
        instructions: instructions?.trim() || undefined,
      },
      { upsert: true, new: true, runValidators: true }
    );

    await logActivity({
      userId: req.user._id,
      action: 'teacher.paymentInfo.update',
      targetType: 'TeacherPaymentInfo',
      targetId: String(info._id),
      metadata: { teacherId: String(req.user._id) },
      req,
    });

    return res.json({
      success: true,
      message: 'Payment info updated successfully',
      data: info,
    });
  } catch (err) {
    console.error('Error updating teacher payment info:', err);
    return res.status(500).json({ success: false, message: 'Failed to update payment info' });
  }
};

// ============================================
// Student Payment Boarding Endpoints
// ============================================

// GET /api/bookings/:id/manual-payment-info
export const getManualPaymentInfo = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const booking = await Booking.findById(id)
      .populate({
        path: 'gig',
        select: 'title price duration teacher',
        populate: { path: 'teacher', select: 'name email avatar' },
      })
      .populate('student', 'name email');

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    // Authorization: only booking student or teacher
    const studentId = (booking as any).student?._id?.toString() || (booking as any).student?.toString();
    const teacherId = (booking as any).gig?.teacher?._id?.toString() || (booking as any).gig?.teacher?.toString();
    const isStudent = studentId === req.user._id.toString();
    const isTeacher = teacherId === req.user._id.toString();

    if (!isStudent && !isTeacher) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    // Fetch teacher payment info
    const teacherPaymentInfo = await TeacherPaymentInfo.findOne({ teacherId });

    if (!teacherPaymentInfo) {
      return res.status(409).json({
        success: false,
        message: 'Teacher has not added payment details yet. Please contact the teacher.',
        code: 'TEACHER_PAYMENT_INFO_MISSING',
      });
    }

    // Check for expired submission window
    const manualPayment = (booking as any).manualPayment;
    if (manualPayment?.acceptedAt && isSubmissionWindowExpired(manualPayment.acceptedAt)) {
      // Mark as expired if not already
      if (manualPayment.status === 'pending_manual') {
        (booking as any).manualPayment.status = 'expired';
        addAuditLog(booking, 'payment.expired', 'pending_manual', 'expired', 'system', 'Submission window expired');
        await booking.save();
      }
    }

    return res.json({
      success: true,
      data: {
        bookingId: booking._id,
        paymentRefCode: (booking as any).paymentRefCode,
        amountExpected: (booking as any).gig?.price || (booking as any).manualPayment?.amountExpected || 0,
        teacherName: (booking as any).gig?.teacher?.name || 'Teacher',
        teacherEmail: (booking as any).gig?.teacher?.email,
        gigTitle: (booking as any).gig?.title,
        paymentStatus: (booking as any).manualPayment?.status || 'pending_manual',
        submissionCount: (booking as any).manualPayment?.submissionCount || 0,
        maxSubmissions: MAX_SUBMISSION_COUNT,
        teacherPaymentInfo: {
          bkashNumber: teacherPaymentInfo.bkashNumber,
          nagadNumber: teacherPaymentInfo.nagadNumber,
          bankAccountName: teacherPaymentInfo.bankAccountName,
          bankAccountNumber: teacherPaymentInfo.bankAccountNumber,
          bankName: teacherPaymentInfo.bankName,
          bankBranch: teacherPaymentInfo.bankBranch,
          routingNumber: teacherPaymentInfo.routingNumber,
          instructions: teacherPaymentInfo.instructions,
          updatedAt: teacherPaymentInfo.updatedAt,
        },
        submissionWindowHours: PAYMENT_SUBMISSION_WINDOW_HOURS,
        acceptedAt: (booking as any).manualPayment?.acceptedAt,
      },
    });
  } catch (err) {
    console.error('Error fetching manual payment info:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch payment info' });
  }
};

// POST /api/bookings/:id/payment/submit
export const submitPaymentProof = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { method, trxid, senderNumber, amountPaid, screenshotUrl } = req.body;

    // Validate required fields
    if (!method || !['bkash', 'nagad', 'bank'].includes(method)) {
      return res.status(422).json({ success: false, message: 'Invalid payment method. Must be bkash, nagad, or bank.' });
    }
    if (!trxid || typeof trxid !== 'string' || trxid.trim().length === 0) {
      return res.status(422).json({ success: false, message: 'Transaction ID (trxid) is required' });
    }

    const booking = await Booking.findById(id)
      .populate({
        path: 'gig',
        select: 'title price teacher',
        populate: { path: 'teacher', select: 'name email' },
      });

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    // Must be the booking student
    const studentId = (booking as any).student?.toString();
    if (studentId !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Only the booking student can submit payment proof' });
    }

    // Booking must be accepted
    if ((booking as any).status !== 'accepted') {
      return res.status(400).json({ success: false, message: 'Booking must be accepted before payment submission' });
    }

    // Manual payment must be initialized and in correct status
    const manualPayment = (booking as any).manualPayment;
    if (!manualPayment || manualPayment.methodType !== 'manual') {
      return res.status(400).json({ success: false, message: 'This booking does not use manual payment' });
    }

    const currentStatus = manualPayment.status;
    if (!['pending_manual', 'rejected'].includes(currentStatus)) {
      return res.status(400).json({
        success: false,
        message: `Cannot submit payment proof when status is "${currentStatus}"`,
      });
    }

    // Check submission count
    const submissionCount = manualPayment.submissionCount || 0;
    if (submissionCount >= MAX_SUBMISSION_COUNT) {
      return res.status(400).json({
        success: false,
        message: `Maximum submission attempts (${MAX_SUBMISSION_COUNT}) reached. Please contact admin.`,
        code: 'MAX_SUBMISSIONS_REACHED',
      });
    }

    // Check submission window
    if (manualPayment.acceptedAt && isSubmissionWindowExpired(manualPayment.acceptedAt)) {
      (booking as any).manualPayment.status = 'expired';
      addAuditLog(booking, 'payment.expired', currentStatus, 'expired', 'system', 'Submission window expired');
      await booking.save();
      return res.status(400).json({
        success: false,
        message: 'Payment submission window has expired',
        code: 'SUBMISSION_WINDOW_EXPIRED',
      });
    }

    // Check trxid uniqueness
    const teacherId = (booking as any).gig?.teacher?._id?.toString() || (booking as any).gig?.teacher?.toString();
    const trimmedTrxid = trxid.trim();

    try {
      await PaymentTrxRegistry.create({
        method,
        trxid: trimmedTrxid,
        bookingId: booking._id,
        teacherId,
        studentId: req.user._id,
        amount: amountPaid || manualPayment.amountExpected || 0,
      });
    } catch (err: any) {
      if (err.code === 11000) {
        return res.status(409).json({
          success: false,
          message: 'This transaction ID has already been used. Please provide a unique transaction ID.',
          code: 'DUPLICATE_TRXID',
        });
      }
      throw err;
    }

    // Fetch current teacher payment info for snapshot
    const teacherPaymentInfo = await TeacherPaymentInfo.findOne({ teacherId });
    const receiverSnapshot = teacherPaymentInfo
      ? {
          bkashNumber: teacherPaymentInfo.bkashNumber,
          nagadNumber: teacherPaymentInfo.nagadNumber,
          bankAccountName: teacherPaymentInfo.bankAccountName,
          bankAccountNumber: teacherPaymentInfo.bankAccountNumber,
          bankName: teacherPaymentInfo.bankName,
          bankBranch: teacherPaymentInfo.bankBranch,
          routingNumber: teacherPaymentInfo.routingNumber,
          snapshotAt: new Date(),
        }
      : undefined;

    // Update booking with payment proof
    (booking as any).manualPayment.method = method;
    (booking as any).manualPayment.trxid = trimmedTrxid;
    (booking as any).manualPayment.senderNumber = senderNumber?.trim() || undefined;
    (booking as any).manualPayment.amountPaid = amountPaid || manualPayment.amountExpected;
    (booking as any).manualPayment.screenshotUrl = screenshotUrl || undefined;
    (booking as any).manualPayment.submittedAt = new Date();
    (booking as any).manualPayment.status = 'submitted';
    (booking as any).manualPayment.submissionCount = submissionCount + 1;
    (booking as any).manualPayment.receiverSnapshot = receiverSnapshot;
    // Clear any previous rejection
    (booking as any).manualPayment.rejectedAt = undefined;
    (booking as any).manualPayment.rejectReason = undefined;

    addAuditLog(booking, 'payment.submitted', currentStatus, 'submitted', req.user._id.toString(), `TrxID: ${trimmedTrxid}`);

    await booking.save();

    await logActivity({
      userId: req.user._id,
      action: 'booking.payment.submitted',
      targetType: 'Booking',
      targetId: booking._id,
      metadata: { method, trxid: trimmedTrxid, submissionCount: submissionCount + 1 },
      req,
    });

    return res.json({
      success: true,
      message: 'Payment proof submitted successfully. Waiting for teacher verification.',
      data: {
        bookingId: booking._id,
        paymentStatus: 'submitted',
        submissionCount: submissionCount + 1,
      },
    });
  } catch (err) {
    console.error('Error submitting payment proof:', err);
    return res.status(500).json({ success: false, message: 'Failed to submit payment proof' });
  }
};

// ============================================
// Teacher Verification Endpoints
// ============================================

// POST /api/bookings/:id/payment/verify
export const verifyPayment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const booking = await Booking.findById(id)
      .populate({
        path: 'gig',
        select: 'title price teacher',
      });

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    // Must be the booking teacher
    const teacherId = (booking as any).gig?.teacher?.toString();
    if (teacherId !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Only the booking teacher can verify payment' });
    }

    const manualPayment = (booking as any).manualPayment;
    if (!manualPayment || manualPayment.status !== 'submitted') {
      return res.status(400).json({
        success: false,
        message: 'Payment must be in "submitted" status to verify',
      });
    }

    // Check verification window
    if (manualPayment.submittedAt && isVerificationWindowExpired(manualPayment.submittedAt)) {
      // Don't auto-expire on verify; teacher can still verify late
      // But log a warning
      console.warn(`Late verification for booking ${id}`);
    }

    const prevStatus = manualPayment.status;
    (booking as any).manualPayment.status = 'verified';
    (booking as any).manualPayment.verifiedAt = new Date();
    (booking as any).manualPayment.verifiedBy = req.user._id;

    addAuditLog(booking, 'payment.verified', prevStatus, 'verified', req.user._id.toString());

    await booking.save();

    await logActivity({
      userId: req.user._id,
      action: 'booking.payment.verified',
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
      },
    });
  } catch (err) {
    console.error('Error verifying payment:', err);
    return res.status(500).json({ success: false, message: 'Failed to verify payment' });
  }
};

// POST /api/bookings/:id/payment/reject
export const rejectPayment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (!reason || typeof reason !== 'string' || reason.trim().length === 0) {
      return res.status(422).json({ success: false, message: 'Rejection reason is required' });
    }

    const booking = await Booking.findById(id)
      .populate({
        path: 'gig',
        select: 'title price teacher',
      });

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    // Must be the booking teacher
    const teacherId = (booking as any).gig?.teacher?.toString();
    if (teacherId !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Only the booking teacher can reject payment' });
    }

    const manualPayment = (booking as any).manualPayment;
    if (!manualPayment || manualPayment.status !== 'submitted') {
      return res.status(400).json({
        success: false,
        message: 'Payment must be in "submitted" status to reject',
      });
    }

    const prevStatus = manualPayment.status;
    (booking as any).manualPayment.status = 'rejected';
    (booking as any).manualPayment.rejectedAt = new Date();
    (booking as any).manualPayment.rejectReason = reason.trim();

    addAuditLog(booking, 'payment.rejected', prevStatus, 'rejected', req.user._id.toString(), reason.trim());

    await booking.save();

    await logActivity({
      userId: req.user._id,
      action: 'booking.payment.rejected',
      targetType: 'Booking',
      targetId: booking._id,
      metadata: { trxid: manualPayment.trxid, reason: reason.trim() },
      req,
    });

    return res.json({
      success: true,
      message: 'Payment rejected. Student can resubmit with correct details.',
      data: {
        bookingId: booking._id,
        paymentStatus: 'rejected',
        submissionCount: manualPayment.submissionCount,
        maxSubmissions: MAX_SUBMISSION_COUNT,
      },
    });
  } catch (err) {
    console.error('Error rejecting payment:', err);
    return res.status(500).json({ success: false, message: 'Failed to reject payment' });
  }
};

// ============================================
// Join Class Endpoint (Gated)
// ============================================

// GET /api/bookings/:id/join
export const joinClass = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const booking = await Booking.findById(id)
      .populate({
        path: 'gig',
        select: 'title price duration teacher',
        populate: { path: 'teacher', select: 'name email avatar' },
      })
      .populate('student', 'name email');

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    // Authorization: only booking student or teacher
    const studentId = (booking as any).student?._id?.toString() || (booking as any).student?.toString();
    const teacherId = (booking as any).gig?.teacher?._id?.toString() || (booking as any).gig?.teacher?.toString();
    const isStudent = studentId === req.user._id.toString();
    const isTeacher = teacherId === req.user._id.toString();

    if (!isStudent && !isTeacher) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    // Booking must be accepted
    if ((booking as any).status !== 'accepted') {
      return res.status(403).json({
        success: false,
        message: 'Booking is not accepted yet',
        paymentStatus: (booking as any).manualPayment?.status,
      });
    }

    // Check manual payment verification (for manual payment bookings)
    const manualPayment = (booking as any).manualPayment;
    if (manualPayment && manualPayment.methodType === 'manual') {
      if (manualPayment.status !== 'verified') {
        return res.status(403).json({
          success: false,
          message: 'Payment verification required to join class',
          code: 'PAYMENT_NOT_VERIFIED',
          paymentStatus: manualPayment.status,
          submissionCount: manualPayment.submissionCount || 0,
          maxSubmissions: MAX_SUBMISSION_COUNT,
        });
      }
    }

    // Enforce join window timing
    const scheduled = (booking as any).scheduledAt || (booking as any).scheduledDate;
    const startTs = new Date(scheduled).getTime();
    if (!startTs || isNaN(startTs)) {
      return res.status(400).json({ success: false, message: 'Invalid scheduled date/time for this booking' });
    }
    const durationMin = (booking as any).gig?.duration || 90;
    const windowOpen = startTs - 15 * 60 * 1000;
    const endTs = startTs + durationMin * 60 * 1000;
    const windowClose = endTs + 60 * 60 * 1000;
    const now = Date.now();

    if (now < windowOpen) {
      return res.status(403).json({ success: false, message: 'Join window not open yet' });
    }
    if (now > windowClose) {
      return res.status(403).json({ success: false, message: 'Join window has closed for this class' });
    }

    // Return meeting details
    return res.json({
      success: true,
      data: {
        bookingId: booking._id,
        meetingLink: (booking as any).meetingLink,
        meetingRoomId: (booking as any).meetingRoomId,
        meetingPassword: (booking as any).meetingPassword,
        roleForThisBooking: isTeacher ? 'teacher' : 'student',
        gig: (booking as any).gig,
        scheduledAt: (booking as any).scheduledAt,
        duration: durationMin,
      },
    });
  } catch (err) {
    console.error('Error joining class:', err);
    return res.status(500).json({ success: false, message: 'Failed to get meeting details' });
  }
};

// ============================================
// Get Payment Status (for polling)
// ============================================

// GET /api/bookings/:id/payment/status
export const getPaymentStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const booking = await Booking.findById(id)
      .select('student gig manualPayment paymentRefCode status')
      .populate({
        path: 'gig',
        select: 'teacher',
      });

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    // Authorization
    const studentId = (booking as any).student?.toString();
    const teacherId = (booking as any).gig?.teacher?.toString();
    const isParticipant = studentId === req.user._id.toString() || teacherId === req.user._id.toString();

    if (!isParticipant) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const manualPayment = (booking as any).manualPayment;

    return res.json({
      success: true,
      data: {
        bookingId: booking._id,
        bookingStatus: (booking as any).status,
        paymentRefCode: (booking as any).paymentRefCode,
        methodType: manualPayment?.methodType,
        paymentStatus: manualPayment?.status || 'pending_manual',
        method: manualPayment?.method,
        trxid: manualPayment?.trxid,
        amountExpected: manualPayment?.amountExpected,
        amountPaid: manualPayment?.amountPaid,
        submittedAt: manualPayment?.submittedAt,
        verifiedAt: manualPayment?.verifiedAt,
        rejectedAt: manualPayment?.rejectedAt,
        rejectReason: manualPayment?.rejectReason,
        submissionCount: manualPayment?.submissionCount || 0,
        maxSubmissions: MAX_SUBMISSION_COUNT,
        screenshotUrl: manualPayment?.screenshotUrl,
        senderNumber: manualPayment?.senderNumber,
      },
    });
  } catch (err) {
    console.error('Error fetching payment status:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch payment status' });
  }
};
