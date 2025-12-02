"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
// Sub-schemas for rich profile sections (no own _id for cleaner arrays)
const ExperienceSchema = new mongoose_1.default.Schema({
    title: String,
    company: String,
    location: String,
    startDate: String,
    endDate: String,
    current: Boolean,
    description: String,
    skills: [String],
}, { _id: false });
const EducationSchema = new mongoose_1.default.Schema({
    degree: String,
    institution: String,
    location: String,
    startDate: String,
    endDate: String,
    current: Boolean,
    description: String,
    gpa: String,
    activities: [String],
}, { _id: false });
const WorkSchema = new mongoose_1.default.Schema({
    position: String,
    company: String,
    location: String,
    startDate: String,
    endDate: String,
    current: Boolean,
    description: String,
    achievements: [String],
}, { _id: false });
const DemoVideoSchema = new mongoose_1.default.Schema({
    title: String,
    description: String,
    videoUrl: String,
    thumbnailUrl: String,
    duration: String,
    subject: String,
    uploadDate: String,
    videoType: { type: String, enum: ['local', 'external'] },
    cloudinaryPublicId: String,
}, { _id: false });
const userSchema = new mongoose_1.default.Schema({
    name: {
        type: String,
        required: [true, 'Please add a name'],
    },
    email: {
        type: String,
        required: [true, 'Please add an email'],
        unique: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please add a valid email'],
    },
    password: {
        type: String,
        required: [true, 'Please add a password'],
        minlength: 6,
        select: false,
    },
    role: {
        type: String,
        enum: ['student', 'teacher', 'admin'],
        required: true,
    },
    // Onboarding status and marketing attribution
    isOnboarded: {
        type: Boolean,
        default: false,
    },
    marketingSource: { type: String },
    // Optional contact and headline
    phone: { type: String },
    location: { type: String },
    headline: { type: String },
    // Teacher rating aggregates
    teacherRatingSum: { type: Number, default: 0 },
    teacherReviewsCount: { type: Number, default: 0 },
    teacherRatingAverage: { type: Number, default: 0, min: 0, max: 5 },
    avatar: {
        type: String,
    },
    coverImage: {
        type: String,
    },
    profile: {
        bio: String,
        // Professional sections
        experiences: [ExperienceSchema],
        education: [EducationSchema],
        work: [WorkSchema],
        demoVideos: [DemoVideoSchema],
        // Skills and languages
        skills: [String],
        languages: [String],
        subjects: [String],
        // Teacher specifics
        hourlyRate: Number,
        availability: String,
        timezone: String,
    },
    // Wallet reference for teachers
    wallet: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: 'Wallet',
    },
}, {
    timestamps: true,
});
// Encrypt password using bcrypt
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        next();
    }
    const salt = await bcryptjs_1.default.genSalt(10);
    this.password = await bcryptjs_1.default.hash(this.password, salt);
});
// Match user entered password to hashed password in database
userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcryptjs_1.default.compare(enteredPassword, this.password);
};
exports.default = mongoose_1.default.model('User', userSchema);
