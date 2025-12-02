"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteGig = exports.updateGig = exports.createGig = exports.getGig = exports.getGigs = void 0;
const Gig_1 = __importDefault(require("../models/Gig"));
const Payment_1 = __importDefault(require("../models/Payment"));
const activityLogger_1 = require("../utils/activityLogger");
// Get all gigs
const getGigs = async (req, res) => {
    try {
        const gigs = await Gig_1.default.find().populate('teacher', 'name email');
        res.json({
            success: true,
            count: gigs.length,
            data: gigs,
        });
    }
    catch (err) {
        res.status(500).json({
            success: false,
            message: 'Error fetching gigs',
        });
    }
};
exports.getGigs = getGigs;
// Get single gig
const getGig = async (req, res) => {
    try {
        const gig = await Gig_1.default.findById(req.params.id).populate('teacher', 'name email');
        if (!gig) {
            return res.status(404).json({
                success: false,
                message: 'Gig not found',
            });
        }
        // Derive payment status for current student if authenticated
        let isPaid = false;
        if (req.user && req.user.role === 'student') {
            const payment = await Payment_1.default.findOne({ gigId: gig._id, studentId: req.user._id, status: 'SUCCESS' }).select('_id');
            isPaid = !!payment;
        }
        res.json({
            success: true,
            data: {
                ...gig.toObject(),
                isPaid,
            },
        });
    }
    catch (err) {
        res.status(500).json({
            success: false,
            message: 'Error fetching gig',
        });
    }
};
exports.getGig = getGig;
// Create new gig
const createGig = async (req, res) => {
    var _a;
    try {
        // Basic validation & coercion
        const { title, description, price, category, duration, thumbnailUrl } = req.body || {};
        if (!title || !description || !category) {
            return res.status(400).json({ success: false, message: 'Validation failed', errors: ['title, description, and category are required'] });
        }
        const priceNum = Number(price);
        const durationNum = Number(duration);
        if (!Number.isFinite(priceNum) || priceNum <= 0) {
            return res.status(400).json({ success: false, message: 'Validation failed', errors: ['price must be a positive number'] });
        }
        if (!Number.isFinite(durationNum) || durationNum <= 0) {
            return res.status(400).json({ success: false, message: 'Validation failed', errors: ['duration must be a positive number (minutes)'] });
        }
        const payload = {
            teacher: req.user._id,
            title: String(title).trim(),
            description: String(description).trim(),
            category: String(category).trim(),
            price: priceNum,
            duration: durationNum,
        };
        if (thumbnailUrl)
            payload.thumbnailUrl = thumbnailUrl;
        const gig = await Gig_1.default.create(payload);
        try {
            await (0, activityLogger_1.logActivity)({
                userId: (_a = req === null || req === void 0 ? void 0 : req.user) === null || _a === void 0 ? void 0 : _a._id,
                action: 'gig.create',
                targetType: 'Gig',
                targetId: gig._id,
                metadata: { title: payload.title, price: payload.price, duration: payload.duration, category: payload.category },
                req,
            });
        }
        catch (_b) { }
        res.status(201).json({
            success: true,
            data: gig,
        });
    }
    catch (err) {
        // Return validation errors if present
        if ((err === null || err === void 0 ? void 0 : err.name) === 'ValidationError') {
            const errors = Object.values(err.errors || {}).map((e) => (e === null || e === void 0 ? void 0 : e.message) || String(e));
            return res.status(400).json({ success: false, message: 'Validation failed', errors });
        }
        console.error('Create gig error:', err);
        res.status(500).json({
            success: false,
            message: 'Error creating gig',
            details: (err === null || err === void 0 ? void 0 : err.message) || undefined,
        });
    }
};
exports.createGig = createGig;
// Update gig
const updateGig = async (req, res) => {
    var _a;
    try {
        let gig = await Gig_1.default.findById(req.params.id);
        if (!gig) {
            return res.status(404).json({
                success: false,
                message: 'Gig not found',
            });
        }
        // Make sure user owns gig
        if (gig.teacher.toString() !== req.user._id.toString()) {
            return res.status(401).json({
                success: false,
                message: 'Not authorized to update this gig',
            });
        }
        const updateDoc = req.body;
        gig = await Gig_1.default.findByIdAndUpdate(req.params.id, updateDoc, {
            new: true,
            runValidators: true,
        });
        try {
            await (0, activityLogger_1.logActivity)({
                userId: (_a = req === null || req === void 0 ? void 0 : req.user) === null || _a === void 0 ? void 0 : _a._id,
                action: 'gig.update',
                targetType: 'Gig',
                targetId: gig === null || gig === void 0 ? void 0 : gig._id,
                metadata: { updateKeys: Object.keys(updateDoc || {}) },
                req,
            });
        }
        catch (_b) { }
        res.json({
            success: true,
            data: gig,
        });
    }
    catch (err) {
        res.status(500).json({
            success: false,
            message: 'Error updating gig',
        });
    }
};
exports.updateGig = updateGig;
// Delete gig
const deleteGig = async (req, res) => {
    var _a;
    try {
        const gig = await Gig_1.default.findById(req.params.id);
        if (!gig) {
            return res.status(404).json({
                success: false,
                message: 'Gig not found',
            });
        }
        // Make sure user owns gig
        if (gig.teacher.toString() !== req.user._id.toString()) {
            return res.status(401).json({
                success: false,
                message: 'Not authorized to delete this gig',
            });
        }
        await gig.deleteOne();
        try {
            await (0, activityLogger_1.logActivity)({
                userId: (_a = req === null || req === void 0 ? void 0 : req.user) === null || _a === void 0 ? void 0 : _a._id,
                action: 'gig.delete',
                targetType: 'Gig',
                targetId: gig._id,
                metadata: { title: gig === null || gig === void 0 ? void 0 : gig.title },
                req,
            });
        }
        catch (_b) { }
        res.json({
            success: true,
            data: {},
        });
    }
    catch (err) {
        res.status(500).json({
            success: false,
            message: 'Error deleting gig',
        });
    }
};
exports.deleteGig = deleteGig;
