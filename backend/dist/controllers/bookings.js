"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateBookingStatus = exports.createBooking = exports.getBookingByRoom = exports.getBooking = exports.getBookings = exports.markAttendance = void 0;
const Booking_1 = __importDefault(require("../models/Booking"));
const Gig_1 = __importDefault(require("../models/Gig"));
const Payment_1 = __importDefault(require("../models/Payment"));
const activityLogger_1 = require("../utils/activityLogger");
const crypto_1 = __importDefault(require("crypto"));
// Helper to slugify gig title
const slugify = (title) => title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
// Helper to generate a secure Jitsi room ID: educonnect-{gigTitleSlug}-{bookingId}-{random16}
const generateMeetingRoomId = (bookingId, gigTitle) => {
    const slug = slugify(gigTitle || 'class');
    const rand = crypto_1.default.randomBytes(8).toString('hex'); // 16 chars
    return `educonnect-${slug}-${bookingId}-${rand}`;
};
// Mark student attendance for a booking
const markAttendance = async (req, res) => {
    var _a;
    try {
        const { id } = req.params;
        const booking = await Booking_1.default.findById(id);
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
        booking.attended = true;
        booking.attendedAt = new Date();
        await booking.save();
        await (0, activityLogger_1.logActivity)({
            userId: (_a = req === null || req === void 0 ? void 0 : req.user) === null || _a === void 0 ? void 0 : _a._id,
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
                attended: booking.attended === true,
                attendedAt: booking.attendedAt,
            }
        });
    }
    catch (err) {
        return res.status(500).json({ success: false, message: 'Failed to mark attendance' });
    }
};
exports.markAttendance = markAttendance;
// Helper to generate a meeting link from room ID
const generateMeetingLink = (roomId) => {
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
const getBookings = async (req, res) => {
    var _a, _b, _c, _d;
    try {
        // Build a safe filter object
        const filter = {};
        if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.role) === 'student') {
            filter.student = req.user._id;
        }
        else if (((_b = req.user) === null || _b === void 0 ? void 0 : _b.role) === 'teacher') {
            const gigs = await Gig_1.default.find({ teacher: req.user._id });
            const gigIds = gigs.map(g => g._id);
            filter.gig = { $in: gigIds };
        }
        // Optional status filter (?status=pending|accepted|rejected|completed)
        const status = (_d = (_c = req.query) === null || _c === void 0 ? void 0 : _c.status) === null || _d === void 0 ? void 0 : _d.toLowerCase();
        const allowedStatuses = new Set(['pending', 'accepted', 'rejected', 'completed']);
        if (status && allowedStatuses.has(status)) {
            filter.status = status;
        }
        const bookings = await Booking_1.default.find(filter)
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
    }
    catch (err) {
        res.status(500).json({
            success: false,
            message: 'Error fetching booking',
        });
    }
};
exports.getBooking = getBooking;
// Get single booking by room
const getBookingByRoom = async (req, res) => {
    var _a, _b, _c;
    try {
        const { roomId } = req.params;
        const booking = await Booking_1.default.findOne({ meetingRoomId: roomId })
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
        const studentId = booking.student && typeof booking.student === 'object' && booking.student._id
            ? booking.student._id
            : booking.student;
        const teacherId = booking.gig && booking.gig.teacher && typeof booking.gig.teacher === 'object' && booking.gig.teacher._id
            ? booking.gig.teacher._id
            : booking.gig.teacher;
        const isStudent = ((_a = studentId === null || studentId === void 0 ? void 0 : studentId.toString) === null || _a === void 0 ? void 0 : _a.call(studentId)) === req.user._id.toString();
        const isTeacher = ((_b = teacherId === null || teacherId === void 0 ? void 0 : teacherId.toString) === null || _b === void 0 ? void 0 : _b.call(teacherId)) === req.user._id.toString();
        if (!isStudent && !isTeacher) {
            return res.status(403).json({ success: false, message: 'Access denied for this meeting' });
        }
        // Must be accepted to join (for both student and teacher)
        if (booking.status !== 'accepted') {
            return res.status(403).json({ success: false, message: 'Booking is not accepted yet' });
        }
        // Enforce join window timing: opens 15 minutes before start, closes 60 minutes after end
        const scheduled = booking.scheduledAt || booking.scheduledDate;
        const startTs = new Date(scheduled).getTime();
        if (!startTs || isNaN(startTs)) {
            return res.status(400).json({ success: false, message: 'Invalid scheduled date/time for this booking' });
        }
        const durationMin = ((_c = booking.gig) === null || _c === void 0 ? void 0 : _c.duration) || 90;
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
            const paid = await Payment_1.default.findOne({ bookingId: booking._id, studentId: req.user._id, status: 'SUCCESS' }).select('_id');
            if (!paid) {
                return res.status(402).json({ success: false, message: 'Payment required to join this class' });
            }
        }
        // Include role hint and meeting password for client auto-lock/join
        const obj = booking.toObject ? booking.toObject() : booking;
        obj.roleForThisBooking = isTeacher ? 'teacher' : 'student';
        // meetingPassword is already included on the doc; ensure it is present for participants only
        return res.json({ success: true, data: obj });
    }
    catch (err) {
        return res.status(500).json({ success: false, message: 'Error validating meeting access' });
    }
};
exports.getBookingByRoom = getBookingByRoom;
// Create booking
const createBooking = async (req, res) => {
    var _a;
    try {
        req.body.student = req.user._id;
        // Support either `gig` or `gigId` from request
        if (!req.body.gig && req.body.gigId) {
            req.body.gig = req.body.gigId;
        }
        const gig = await Gig_1.default.findById(req.body.gig);
        if (!gig) {
            return res.status(404).json({
                success: false,
                message: 'Gig not found',
            });
        }
        // Compute canonical UTC scheduledAt and capture student's timezone
        const { scheduledDate, scheduledTime, scheduledAt, timeZone } = req.body;
        let computedScheduledAt;
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
        const booking = await Booking_1.default.create(req.body);
        await (0, activityLogger_1.logActivity)({
            userId: (_a = req === null || req === void 0 ? void 0 : req.user) === null || _a === void 0 ? void 0 : _a._id,
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
    var _a;
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
        const prevStatus = booking.status;
        booking.status = req.body.status;
        // If accepting and no meeting link yet, generate it
        if (req.body.status === 'accepted' && !booking.meetingLink) {
            const roomId = generateMeetingRoomId(booking._id.toString(), (gig === null || gig === void 0 ? void 0 : gig.title) || 'class');
            const meetingLink = generateMeetingLink(roomId);
            booking.meetingRoomId = roomId;
            booking.meetingLink = meetingLink;
            // Optional meeting password for added security (default disabled to reduce friction)
            const enablePassword = String(process.env.MEETING_PASSWORD_ENABLED || '').toLowerCase() === 'true';
            if (enablePassword) {
                booking.meetingPassword = crypto_1.default.randomBytes(8).toString('hex');
            }
        }
        // If class marked completed, expose review visibility
        if (req.body.status === 'completed') {
            booking.reviewVisibility = true;
        }
        await booking.save();
        await (0, activityLogger_1.logActivity)({
            userId: (_a = req === null || req === void 0 ? void 0 : req.user) === null || _a === void 0 ? void 0 : _a._id,
            action: 'booking.updateStatus',
            targetType: 'Booking',
            targetId: booking._id,
            metadata: { from: prevStatus, to: req.body.status },
            req,
        });
        // Populate with gig teacher and student for client convenience
        const populated = await Booking_1.default.findById(booking._id)
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
    }
    catch (err) {
        res.status(500).json({
            success: false,
            message: 'Error updating booking status',
        });
    }
};
exports.updateBookingStatus = updateBookingStatus;
