"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateBookingStatus = exports.findBookingsByUser = exports.createBooking = void 0;
const Booking_1 = __importDefault(require("../models/Booking"));
const gig_service_1 = require("./gig.service");
const createBooking = async (bookingData) => {
    const gig = await (0, gig_service_1.findGigById)(bookingData.gig);
    if (!gig) {
        throw new Error('Gig not found');
    }
    return await Booking_1.default.create(bookingData);
};
exports.createBooking = createBooking;
const findBookingsByUser = async (userId, role) => {
    if (role === 'student') {
        return await Booking_1.default.find({ student: userId })
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
    else {
        const gigs = await (0, gig_service_1.findGigById)(userId);
        return await Booking_1.default.find({ gig: { $in: gigs.map(g => g._id) } })
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
exports.findBookingsByUser = findBookingsByUser;
const updateBookingStatus = async (bookingId, status) => {
    const booking = await Booking_1.default.findById(bookingId);
    if (!booking) {
        throw new Error('Booking not found');
    }
    booking.status = status;
    return await booking.save();
};
exports.updateBookingStatus = updateBookingStatus;
