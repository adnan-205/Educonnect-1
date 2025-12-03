import { Request, Response } from 'express';
import Booking from '../models/Booking';
import Gig from '../models/Gig';
import Payment from '../models/Payment';
import { logActivity } from '../utils/activityLogger';
import crypto from 'crypto';

// Helper to slugify gig title
const slugify = (title: string) => title
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/(^-|-$)+/g, '');

// Helper to generate a secure Jitsi room ID: tutorconnected-{gigTitleSlug}-{bookingId}-{random16}
const generateMeetingRoomId = (bookingId: string, gigTitle: string): string => {
  const slug = slugify(gigTitle || 'class');
  const rand = crypto.randomBytes(8).toString('hex'); // 16 chars
  return `tutorconnected-${slug}-${bookingId}-${rand}`;
};

// Mark student attendance for a booking
export const markAttendance = async (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id: string };
    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    // Only the student who owns this booking can mark attendance
    if (booking.student.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    // Only accepted bookings can be attended
    if (booking.status !== 'accepted') {
      return res.status(400).json({ success: false, message: 'Cannot mark attendance for non-accepted booking' });
    }

    // Mark attendance
    (booking as any).attended = true;
    (booking as any).attendedAt = new Date();
    await booking.save();

    await logActivity({
      userId: (req as any)?.user?._id,
      action: 'booking.attendance.marked',
      targetType: 'Booking',
      targetId: booking._id,
      metadata: { bookingId: String(booking._id) },
      req,
    });
    return res.json({
      success: true,
      data: {
        bookingId: String(booking._id),
        attended: (booking as any).attended === true,
        attendedAt: (booking as any).attendedAt,
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to mark attendance' });
  }
};

// Helper to generate a meeting link from room ID
const generateMeetingLink = (roomId: string): string => {
  // Use self-hosted Jitsi domain if configured, otherwise fallback to meet.jit.si
  const jitsiDomain = process.env.JITSI_DOMAIN || 'meet.jit.si';
  const scheme = jitsiDomain.includes('localhost') || jitsiDomain.includes('127.0.0.1') ? 'http' : 'https';
  const hash = [
    'config.prejoinPageEnabled=false',
    'config.disableDeepLinking=true',
    'config.enableWelcomePage=false'
    // interfaceConfig options can also be added if desired, e.g. hiding watermarks
  ].join('&');
  return `${scheme}://${jitsiDomain}/${roomId}#${hash}`;
};

// Get all bookings
export const getBookings = async (req: Request, res: Response) => {
  try {
    // Build a safe filter object
    const filter: any = {};

    if (req.user?.role === 'student') {
      filter.student = req.user._id;
    } else if (req.user?.role === 'teacher') {
      const gigs = await Gig.find({ teacher: req.user._id });
      const gigIds = gigs.map(g => g._id);
      filter.gig = { $in: gigIds };
    }

    // Optional status filter (?status=pending|accepted|rejected|completed)
    const status = (req.query?.status as string | undefined)?.toLowerCase();
    const allowedStatuses = new Set(['pending', 'accepted', 'rejected', 'completed']);
    if (status && allowedStatuses.has(status)) {
      filter.status = status;
    }

    const bookings = await Booking.find(filter)
      .populate({
        path: 'gig',
        select: 'title price duration category thumbnailUrl',
        populate: { path: 'teacher', select: 'name email avatar' },
      })
      .populate('student', 'name email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: bookings.length,
      data: bookings,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Error fetching bookings',
    });
  }
};

// Get single booking
export const getBooking = async (req: Request, res: Response) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate({
        path: 'gig',
        select: 'title price duration category thumbnailUrl',
        populate: {
          path: 'teacher',
          select: 'name email avatar',
        },
      })
      .populate('student', 'name email');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
    }

    res.json({
      success: true,
      data: booking,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Error fetching booking',
    });
  }
};

// Get single booking by room
export const getBookingByRoom = async (req: Request, res: Response) => {
  try {
    const { roomId } = req.params as { roomId: string };

    const booking = await Booking.findOne({ meetingRoomId: roomId })
      .populate({
        path: 'gig',
        select: 'title price duration category thumbnailUrl teacher',
        populate: { path: 'teacher', select: 'name email avatar' },
      })
      .populate('student', 'name email');

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Meeting not found' });
    }

    // Normalize IDs to support both populated and unpopulated refs
    const studentId = (booking as any).student && typeof (booking as any).student === 'object' && (booking as any).student._id
      ? (booking as any).student._id
      : (booking as any).student;
    const teacherId = (booking as any).gig && (booking as any).gig.teacher && typeof (booking as any).gig.teacher === 'object' && (booking as any).gig.teacher._id
      ? (booking as any).gig.teacher._id
      : (booking as any).gig.teacher;

    const isStudent = studentId?.toString?.() === req.user._id.toString();
    const isTeacher = teacherId?.toString?.() === req.user._id.toString();

    if (!isStudent && !isTeacher) {
      return res.status(403).json({ success: false, message: 'Access denied for this meeting' });
    }

    // Must be accepted to join (for both student and teacher)
    if ((booking as any).status !== 'accepted') {
      return res.status(403).json({ success: false, message: 'Booking is not accepted yet' });
    }

    // Enforce join window timing: opens 15 minutes before start, closes 60 minutes after end
    const scheduled = (booking as any).scheduledAt || (booking as any).scheduledDate;
    const startTs = new Date(scheduled).getTime();
    if (!startTs || isNaN(startTs)) {
      return res.status(400).json({ success: false, message: 'Invalid scheduled date/time for this booking' });
    }
    const durationMin = (booking as any).gig?.duration || 90;
    const windowOpen = startTs - 15 * 60 * 1000; // 15 minutes before start
    const endTs = startTs + durationMin * 60 * 1000;
    const windowClose = endTs + 60 * 60 * 1000; // 60 minutes after end
    const now = Date.now();
    if (now < windowOpen) {
      return res.status(403).json({ success: false, message: 'Join window not open yet' });
    }
    if (now > windowClose) {
      return res.status(403).json({ success: false, message: 'Join window has closed for this class' });
    }

    // Enforce per-booking payment for students before joining
    if (isStudent) {
      const paid = await Payment.findOne({ bookingId: (booking as any)._id, studentId: req.user._id, status: 'SUCCESS' }).select('_id');
      if (!paid) {
        return res.status(402).json({ success: false, message: 'Payment required to join this class' });
      }
    }

    // Include role hint and meeting password for client auto-lock/join
    const obj = (booking as any).toObject ? (booking as any).toObject() : booking;
    (obj as any).roleForThisBooking = isTeacher ? 'teacher' : 'student';
    // meetingPassword is already included on the doc; ensure it is present for participants only
    return res.json({ success: true, data: obj });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Error validating meeting access' });
  }
};

// Create booking
export const createBooking = async (req: Request, res: Response) => {
  try {
    req.body.student = req.user._id;
    // Support either `gig` or `gigId` from request
    if (!req.body.gig && req.body.gigId) {
      req.body.gig = req.body.gigId;
    }
    const gig = await Gig.findById(req.body.gig);

    if (!gig) {
      return res.status(404).json({
        success: false,
        message: 'Gig not found',
      });
    }

    // Compute canonical UTC scheduledAt and capture student's timezone
    const { scheduledDate, scheduledTime, scheduledAt, timeZone } = req.body as any;

    let computedScheduledAt: Date | undefined;
    if (scheduledAt) {
      // Client provided canonical UTC
      const d = new Date(scheduledAt);
      if (!isNaN(d.getTime())) {
        computedScheduledAt = d;
      }
    }
    if (!computedScheduledAt && scheduledDate && scheduledTime) {
      // Fallback: construct from provided local date/time (assumed client local)
      // Note: for perfect timezone handling, prefer sending scheduledAt from client.
      const fallback = new Date(`${scheduledDate}T${scheduledTime}:00`);
      if (!isNaN(fallback.getTime())) {
        computedScheduledAt = fallback;
      }
    }

    if (computedScheduledAt) {
      req.body.scheduledAt = computedScheduledAt;
    }
    if (timeZone) {
      req.body.timeZone = timeZone;
    }

    const booking = await Booking.create(req.body);

    await logActivity({
      userId: (req as any)?.user?._id,
      action: 'booking.create',
      targetType: 'Booking',
      targetId: booking._id,
      metadata: {
        gig: String(req.body.gig),
        scheduledAt: req.body.scheduledAt,
        timeZone: req.body.timeZone,
      },
      req,
    });

    res.status(201).json({
      success: true,
      data: booking,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Error creating booking',
    });
  }
};

// Update booking status
export const updateBookingStatus = async (req: Request, res: Response) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
    }

    const gig = await Gig.findById(booking.gig);

    // Check if the user is the teacher of this gig
    if (gig?.teacher.toString() !== req.user._id.toString()) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to update this booking',
      });
    }

    const prevStatus = (booking as any).status;
    booking.status = req.body.status;

    // If accepting and no meeting link yet, generate it
    if (req.body.status === 'accepted' && !booking.meetingLink) {
      const roomId = generateMeetingRoomId(booking._id.toString(), gig?.title || 'class');
      const meetingLink = generateMeetingLink(roomId);
      (booking as any).meetingRoomId = roomId;
      (booking as any).meetingLink = meetingLink;
      // Optional meeting password for added security (default disabled to reduce friction)
      const enablePassword = String(process.env.MEETING_PASSWORD_ENABLED || '').toLowerCase() === 'true';
      if (enablePassword) {
        (booking as any).meetingPassword = crypto.randomBytes(8).toString('hex');
      }
    }

    // If class marked completed, expose review visibility
    if (req.body.status === 'completed') {
      (booking as any).reviewVisibility = true;
    }

    await booking.save();

    await logActivity({
      userId: (req as any)?.user?._id,
      action: 'booking.updateStatus',
      targetType: 'Booking',
      targetId: booking._id,
      metadata: { from: prevStatus, to: req.body.status },
      req,
    });

    // Populate with gig teacher and student for client convenience
    const populated = await Booking.findById(booking._id)
      .populate({
        path: 'gig',
        select: 'title price duration category thumbnailUrl',
        populate: { path: 'teacher', select: 'name email avatar' },
      })
      .populate('student', 'name email');

    res.json({
      success: true,
      data: populated,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Error updating booking status',
    });
  }
};
