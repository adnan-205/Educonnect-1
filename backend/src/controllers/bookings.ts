import { Request, Response } from 'express';
import Booking from '../models/Booking';
import Gig from '../models/Gig';

// Get all bookings
export const getBookings = async (req: Request, res: Response) => {
  try {
    let query;
    const { status } = req.query;

    // If user is student, get only their bookings
    if (req.user.role === 'student') {
      query = Booking.find({ student: req.user._id });
    }
    // If user is teacher, get bookings for their gigs
    else if (req.user.role === 'teacher') {
      const gigs = await Gig.find({ teacher: req.user._id });
      const gigIds = gigs.map(gig => gig._id);
      query = Booking.find({ gig: { $in: gigIds } });
    }

    // Filter by status if provided
    if (status && typeof status === 'string') {
      query = query.where('status').equals(status);
    }

    const bookings = await query
      .populate({
        path: 'gig',
        select: 'title price duration',
        populate: {
          path: 'teacher',
          select: 'name email',
        },
      })
      .populate('student', 'name email')
      .sort({ createdAt: -1 }); // Sort by newest first

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

// Create booking
export const createBooking = async (req: Request, res: Response) => {
  try {
    req.body.student = req.user._id;
    const gig = await Gig.findById(req.body.gig);

    if (!gig) {
      return res.status(404).json({
        success: false,
        message: 'Gig not found',
      });
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

// Helper function to generate Jitsi meeting room ID
const generateMeetingRoomId = (bookingId: string, gigTitle: string): string => {
  // Create a unique room ID based on booking ID and gig title
  const sanitizedTitle = gigTitle.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
  const shortBookingId = bookingId.substring(0, 8);
  return `educonnect-${sanitizedTitle}-${shortBookingId}`;
};

// Helper function to generate Jitsi meeting link
const generateMeetingLink = (roomId: string): string => {
  // Use localhost for local development, change to your production domain
  const jitsiDomain = process.env.JITSI_DOMAIN || 'localhost';
  return `http://${jitsiDomain}/${roomId}`;
};

// Update booking status
export const updateBookingStatus = async (req: Request, res: Response) => {
  try {
    const booking = await Booking.findById(req.params.id).populate('gig');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
    }

    const gig = booking.gig as any;

    // Check if the user is the teacher of this gig
    if (gig?.teacher.toString() !== req.user._id.toString()) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to update this booking',
      });
    }

    booking.status = req.body.status;

    // If booking is being accepted, generate Jitsi meeting link
    if (req.body.status === 'accepted' && !booking.meetingLink) {
      const roomId = generateMeetingRoomId(booking._id.toString(), gig.title);
      const meetingLink = generateMeetingLink(roomId);
      
      booking.meetingRoomId = roomId;
      booking.meetingLink = meetingLink;
    }

    await booking.save();

    // Populate the booking with gig and student details for response
    const populatedBooking = await Booking.findById(booking._id)
      .populate({
        path: 'gig',
        select: 'title price duration',
        populate: {
          path: 'teacher',
          select: 'name email',
        },
      })
      .populate('student', 'name email');

    res.json({
      success: true,
      data: populatedBooking,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Error updating booking status',
    });
  }
};

// Get teacher dashboard statistics
export const getTeacherDashboardStats = async (req: Request, res: Response) => {
  try {
    // Get all gigs for the teacher
    const gigs = await Gig.find({ teacher: req.user._id });
    const gigIds = gigs.map(gig => gig._id);

    // Get booking counts by status
    const [pendingCount, acceptedCount, rejectedCount, completedCount] = await Promise.all([
      Booking.countDocuments({ gig: { $in: gigIds }, status: 'pending' }),
      Booking.countDocuments({ gig: { $in: gigIds }, status: 'accepted' }),
      Booking.countDocuments({ gig: { $in: gigIds }, status: 'rejected' }),
      Booking.countDocuments({ gig: { $in: gigIds }, status: 'completed' }),
    ]);

    res.json({
      success: true,
      data: {
        pending: pendingCount,
        accepted: acceptedCount,
        rejected: rejectedCount,
        completed: completedCount,
        total: pendingCount + acceptedCount + rejectedCount + completedCount,
      },
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard statistics',
    });
  }
};
