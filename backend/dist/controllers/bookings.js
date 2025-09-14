"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateBookingStatus = exports.createBooking = exports.getBooking = exports.getBookings = void 0;
const Booking_1 = __importDefault(require("../models/Booking"));
const Gig_1 = __importDefault(require("../models/Gig"));
// Get all bookings
const getBookings = async (req, res) => {
    try {
        let query;
        // If user is student, get only their bookings
        if (req.user.role === 'student') {
            query = Booking_1.default.find({ student: req.user._id });
        }
        // If user is teacher, get bookings for their gigs
        else if (req.user.role === 'teacher') {
            const gigs = await Gig_1.default.find({ teacher: req.user._id });
            const gigIds = gigs.map(gig => gig._id);
            query = Booking_1.default.find({ gig: { $in: gigIds } });
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
    }
    catch (err) {
        res.status(500).json({
            success: false,
            message: 'Error fetching bookings',
        });
    }
};
exports.getBookings = getBookings;
// Get single booking
const getBooking = async (req, res) => {
    try {
        const booking = await Booking_1.default.findById(req.params.id)
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
    }
    catch (err) {
        res.status(500).json({
            success: false,
            message: 'Error fetching booking',
        });
    }
};
exports.getBooking = getBooking;
// Create booking
const createBooking = async (req, res) => {
    try {
        req.body.student = req.user._id;
        const gig = await Gig_1.default.findById(req.body.gig);
        if (!gig) {
            return res.status(404).json({
                success: false,
                message: 'Gig not found',
            });
        }
        const booking = await Booking_1.default.create(req.body);
        res.status(201).json({
            success: true,
            data: booking,
        });
    }
    catch (err) {
        res.status(500).json({
            success: false,
            message: 'Error creating booking',
        });
    }
};
exports.createBooking = createBooking;
// Update booking status
const updateBookingStatus = async (req, res) => {
    try {
        const booking = await Booking_1.default.findById(req.params.id);
        if (!booking) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found',
            });
        }
        const gig = await Gig_1.default.findById(booking.gig);
        // Check if the user is the teacher of this gig
        if ((gig === null || gig === void 0 ? void 0 : gig.teacher.toString()) !== req.user._id.toString()) {
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
    }
    catch (err) {
        res.status(500).json({
            success: false,
            message: 'Error updating booking status',
        });
    }
};
exports.updateBookingStatus = updateBookingStatus;
