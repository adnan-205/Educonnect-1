import Booking from '../models/Booking';
import { findGigById } from './gig.service';

export const createBooking = async (bookingData: any) => {
  const gig = await findGigById(bookingData.gig);
  if (!gig) {
    throw new Error('Gig not found');
  }
  return await Booking.create(bookingData);
};

export const findBookingsByUser = async (userId: string, role: string) => {
  if (role === 'student') {
    return await Booking.find({ student: userId })
      .populate({
        path: 'gig',
        select: 'title price duration',
        populate: {
          path: 'teacher',
          select: 'name email',
        },
      })
      .populate('student', 'name email');
  } else {
    const gigs = await findGigById(userId);
    return await Booking.find({ gig: { $in: gigs.map(g => g._id) } })
      .populate({
        path: 'gig',
        select: 'title price duration',
        populate: {
          path: 'teacher',
          select: 'name email',
        },
      })
      .populate('student', 'name email');
  }
};

export const updateBookingStatus = async (bookingId: string, status: string) => {
  const booking = await Booking.findById(bookingId);
  if (!booking) {
    throw new Error('Booking not found');
  }
  
  booking.status = status;
  return await booking.save();
};
