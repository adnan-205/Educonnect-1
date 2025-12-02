"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const gigSchema = new mongoose_1.default.Schema({
    teacher: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    title: {
        type: String,
        required: [true, 'Please add a title'],
        trim: true,
        maxlength: [100, 'Title cannot be more than 100 characters'],
    },
    description: {
        type: String,
        required: [true, 'Please add a description'],
        maxlength: [500, 'Description cannot be more than 500 characters'],
    },
    price: {
        type: Number,
        required: [true, 'Please add a price'],
    },
    category: {
        type: String,
        required: [true, 'Please add a category'],
    },
    duration: {
        type: Number,
        required: [true, 'Please add duration in minutes'],
    },
    averageRating: {
        type: Number,
        default: 0,
        min: 0,
        max: 5,
        index: true,
    },
    reviewsCount: {
        type: Number,
        default: 0,
        min: 0,
    },
    thumbnailUrl: {
        type: String,
    },
    thumbnailPublicId: {
        type: String,
    },
    availability: {
        days: [{
                type: String,
                enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
            }],
        times: [String],
    },
}, {
    timestamps: true,
});
exports.default = mongoose_1.default.model('Gig', gigSchema);
