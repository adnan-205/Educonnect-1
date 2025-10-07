"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteGig = exports.updateGig = exports.createGig = exports.getGig = exports.getGigs = void 0;
const Gig_1 = __importDefault(require("../models/Gig"));
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
        res.json({
            success: true,
            data: gig,
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
    try {
        req.body.teacher = req.user._id;
        const gig = await Gig_1.default.create(req.body);
        res.status(201).json({
            success: true,
            data: gig,
        });
    }
    catch (err) {
        res.status(500).json({
            success: false,
            message: 'Error creating gig',
        });
    }
};
exports.createGig = createGig;
// Update gig
const updateGig = async (req, res) => {
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
        gig = await Gig_1.default.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true,
        });
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
