import { Request, Response } from 'express';
import Booking from '../models/Booking';
import Gig from '../models/Gig';

// Get all bookings
export const getBookings = async (req: Request, res: Response) => {
  try {
    let query;

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

    const bookings = await query
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
    await booking.save();

    res.json({
      success: true,
      data: booking,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Error updating booking status',
    });
  }
};
