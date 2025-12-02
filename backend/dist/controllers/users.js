"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateMe = exports.getUserGigs = exports.getUser = void 0;
const User_1 = __importDefault(require("../models/User"));
const Gig_1 = __importDefault(require("../models/Gig"));
const activityLogger_1 = require("../utils/activityLogger");
// GET /api/users/:id - public profile basics
const getUser = async (req, res) => {
    try {
        const user = await User_1.default.findById(req.params.id)
            .select('name email role profile createdAt avatar coverImage phone location headline teacherRatingAverage teacherReviewsCount');
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        res.json({ success: true, data: user });
    }
    catch (err) {
        res.status(500).json({ success: false, message: 'Error fetching user' });
    }
};
exports.getUser = getUser;
// GET /api/users/:id/gigs - public gigs for a teacher
const getUserGigs = async (req, res) => {
    try {
        const user = await User_1.default.findById(req.params.id).select('_id role');
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        const gigs = await Gig_1.default.find({ teacher: user._id })
            .select('title price category duration thumbnailUrl createdAt averageRating reviewsCount');
        res.json({ success: true, count: gigs.length, data: gigs });
    }
    catch (err) {
        res.status(500).json({ success: false, message: 'Error fetching user gigs' });
    }
};
exports.getUserGigs = getUserGigs;
// PUT /api/users/me - update own basic profile (avatar, coverImage, profile.bio/education/experience)
const updateMe = async (req, res) => {
    try {
        const authUser = req.user;
        const userId = (authUser === null || authUser === void 0 ? void 0 : authUser._id) || (authUser === null || authUser === void 0 ? void 0 : authUser.id);
        if (!userId) {
            return res.status(401).json({ success: false, message: 'Not authorized' });
        }
        const patch = {};
        // Top-level fields
        if (typeof req.body.name === 'string')
            patch['name'] = req.body.name;
        if (typeof req.body.headline === 'string')
            patch['headline'] = req.body.headline;
        if (typeof req.body.phone === 'string')
            patch['phone'] = req.body.phone;
        if (typeof req.body.location === 'string')
            patch['location'] = req.body.location;
        if (typeof req.body.avatar === 'string')
            patch['avatar'] = req.body.avatar;
        if (typeof req.body.coverImage === 'string')
            patch['coverImage'] = req.body.coverImage;
        // Onboarding fields
        if (typeof req.body.marketingSource === 'string')
            patch['marketingSource'] = req.body.marketingSource;
        if (typeof req.body.isOnboarded === 'boolean')
            patch['isOnboarded'] = req.body.isOnboarded;
        // Optional role update (limit to known roles)
        if (typeof req.body.role === 'string' && ['student', 'teacher', 'admin'].includes(req.body.role)) {
            patch['role'] = req.body.role;
        }
        // Nested profile fields via dot-notation (merges without wiping unspecified keys)
        const p = req.body.profile || {};
        if (p && typeof p === 'object') {
            if (p.bio !== undefined)
                patch['profile.bio'] = p.bio;
            if (p.experiences !== undefined)
                patch['profile.experiences'] = p.experiences;
            if (p.education !== undefined)
                patch['profile.education'] = p.education;
            if (p.work !== undefined)
                patch['profile.work'] = p.work;
            if (p.demoVideos !== undefined)
                patch['profile.demoVideos'] = p.demoVideos;
            if (p.skills !== undefined)
                patch['profile.skills'] = p.skills;
            if (p.languages !== undefined)
                patch['profile.languages'] = p.languages;
            if (p.subjects !== undefined)
                patch['profile.subjects'] = p.subjects;
            if (p.hourlyRate !== undefined)
                patch['profile.hourlyRate'] = p.hourlyRate;
            if (p.availability !== undefined)
                patch['profile.availability'] = p.availability;
            if (p.timezone !== undefined)
                patch['profile.timezone'] = p.timezone;
        }
        const updated = await User_1.default.findByIdAndUpdate(userId, { $set: patch }, { new: true })
            .select('name email role isOnboarded marketingSource profile avatar coverImage phone location headline');
        try {
            await (0, activityLogger_1.logActivity)({
                userId,
                action: 'user.updateMe',
                targetType: 'User',
                targetId: userId,
                metadata: { changedKeys: Object.keys(patch) },
                req,
            });
        }
        catch (_a) { }
        res.json({ success: true, data: updated });
    }
    catch (err) {
        console.error('updateMe error:', err);
        res.status(500).json({ success: false, message: 'Error updating profile' });
    }
};
exports.updateMe = updateMe;
