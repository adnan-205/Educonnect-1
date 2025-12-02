"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const bookingSchema = new mongoose_1.default.Schema({
    student: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    gig: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: 'Gig',
        required: true,
    },
    status: {
        type: String,
        enum: ['pending', 'accepted', 'rejected', 'completed'],
        default: 'pending',
    },
    scheduledDate: {
        type: Date,
        required: [true, 'Please add a scheduled date'],
    },
    scheduledTime: {
        type: String,
        required: [true, 'Please add a scheduled time'],
    },
    // Canonical UTC datetime for the class start time
    scheduledAt: {
        type: Date,
        required: false,
        index: true,
    },
    // IANA timezone string of the student when booking (e.g., "Asia/Dhaka")
    timeZone: {
        type: String,
        required: false,
    },
    // Optional meeting fields (used by Jitsi integration)
    meetingLink: {
        type: String,
        required: false,
    },
    meetingRoomId: {
        type: String,
        required: false,
    },
    meetingPassword: {
        type: String,
        required: false,
        select: true,
    },
    // Attendance tracking (student)
    attended: {
        type: Boolean,
        default: false,
        required: false,
        index: true,
    },
    attendedAt: {
        type: Date,
        required: false,
    },
    // Rating & review snapshot fields (for quick access per booking)
    teacherRating: {
        type: Number,
        min: 1,
        max: 5,
        required: false,
    },
    studentRating: {
        type: Number,
        min: 1,
        max: 5,
        required: false,
    },
    reviewComment: {
        type: String,
        maxlength: 2000,
        required: false,
    },
    reviewVisibility: {
        type: Boolean,
        default: false,
        index: true,
    },
}, {
    timestamps: true,
});
exports.default = mongoose_1.default.model('Booking', bookingSchema);
