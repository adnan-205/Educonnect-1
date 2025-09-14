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
}, {
    timestamps: true,
});
exports.default = mongoose_1.default.model('Booking', bookingSchema);
