import Booking from '../models/Booking';

export class BookingRepository {
  /** Find a booking by its Mongo ObjectId. */
  async findById(id: string) {
    return Booking.findById(id);
  }

  /** Find a booking by its Jitsi meetingRoomId. */
  async findByRoomId(roomId: string) {
    return Booking.findOne({ meetingRoomId: roomId });
  }

  /** Update the status of a booking and return the new document. */
  async updateStatus(id: string, status: string) {
    return Booking.findByIdAndUpdate(id, { status }, { new: true });
  }
}

export default new BookingRepository();
