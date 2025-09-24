import { Request, Response } from 'express';
import Booking from '../models/Booking';
import Gig from '../models/Gig';
import Payment from '../models/Payment';

// Helper to generate a deterministic Jitsi room ID
const generateMeetingRoomId = (bookingId: string, gigTitle: string): string => {
  const sanitizedTitle = gigTitle.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
  const shortBookingId = bookingId.substring(0, 8);
  return `educonnect-${sanitizedTitle}-${shortBookingId}`;
};

// Helper to generate a meeting link from room ID
const generateMeetingLink = (roomId: string): string => {
  const jitsiDomain = process.env.JITSI_DOMAIN || 'localhost';
  const isLocal = jitsiDomain === 'localhost' || jitsiDomain === '127.0.0.1' || jitsiDomain.startsWith('192.168.') || jitsiDomain.startsWith('10.');
  const scheme = isLocal ? 'http' : 'https';
  return `${scheme}://${jitsiDomain}/${roomId}`;
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
        select: 'title price duration',
        populate: { path: 'teacher', select: 'name email' },
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
        select: 'title price duration',
        populate: {
          path: 'teacher',
          select: 'name email',
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
        select: 'title price duration teacher',
        populate: { path: 'teacher', select: 'name email' },
      })
      .populate('student', 'name email');

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Meeting not found' });
    }

    const isStudent = booking.student && booking.student.toString() === req.user._id.toString();
    const isTeacher = booking.gig && (booking.gig as any).teacher && (booking.gig as any).teacher._id?.toString?.() === req.user._id.toString();

    if (!isStudent && !isTeacher) {
      return res.status(403).json({ success: false, message: 'Access denied for this meeting' });
    }

    // Enforce payment for students before joining class
    if (isStudent) {
      const gigId = (booking.gig as any)?._id || booking.gig;
      const paid = await Payment.findOne({ gigId, studentId: req.user._id, status: 'SUCCESS' }).select('_id');
      if (!paid) {
        return res.status(402).json({ success: false, message: 'Payment required to join this class' });
      }
    }

    return res.json({ success: true, data: booking });
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

    booking.status = req.body.status;

    // If accepting and no meeting link yet, generate it
    if (req.body.status === 'accepted' && !booking.meetingLink) {
      const roomId = generateMeetingRoomId(booking._id.toString(), gig?.title || 'class');
      const meetingLink = generateMeetingLink(roomId);
      (booking as any).meetingRoomId = roomId;
      (booking as any).meetingLink = meetingLink;
    }

    await booking.save();

    // Populate with gig teacher and student for client convenience
    const populated = await Booking.findById(booking._id)
      .populate({
        path: 'gig',
        select: 'title price duration',
        populate: { path: 'teacher', select: 'name email' },
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
