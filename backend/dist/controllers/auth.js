"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.login = exports.updateMyRole = exports.updateRole = exports.register = exports.clerkSync = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_1 = __importDefault(require("../models/User"));
const activityLogger_1 = require("../utils/activityLogger");
// Helper function to generate JWT token
const generateToken = (userId) => {
    return jsonwebtoken_1.default.sign({ id: userId }, process.env.JWT_SECRET || 'devsecret', {
        expiresIn: process.env.JWT_EXPIRE || '30d',
    });
};
// Clerk sync: upsert a user by email (coming from Clerk) and return backend JWT
const clerkSync = async (req, res) => {
    var _a;
    try {
        const { email, name } = req.body;
        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Email is required',
            });
        }
        // Find or create user
        let user = await User_1.default.findOne({ email });
        if (!user) {
            // Default role as student; can be updated later via updateRole
            const generatedPassword = Math.random().toString(36).slice(-12);
            const userName = (name && name.trim()) ? name.trim() : email.split('@')[0];
            user = await User_1.default.create({
                name: userName,
                email,
                password: generatedPassword,
                role: 'student',
            });
        }
        else {
            // Update name if it's provided, not empty, and different from current name
            if (name && name.trim() && name.trim() !== user.name) {
                try {
                    user = await User_1.default.findOneAndUpdate({ email }, { name: name.trim() }, { new: true, runValidators: true });
                    if (!user) {
                        // If update failed, fetch user again
                        user = await User_1.default.findOne({ email });
                    }
                }
                catch (updateError) {
                    console.error('Error updating user name in clerkSync:', updateError);
                    // Continue with existing user if update fails
                }
            }
        }
        // Promote to admin if email allowlisted
        try {
            const allow = (process.env.ADMIN_EMAILS || '')
                .split(',')
                .map(e => e.trim().toLowerCase())
                .filter(Boolean);
            if (email && allow.includes(email.toLowerCase()) && user.role !== 'admin') {
                user = await User_1.default.findOneAndUpdate({ email }, { role: 'admin' }, { new: true }) || user;
            }
        }
        catch (adminError) {
            console.error('Error promoting user to admin:', adminError);
            // Continue even if admin promotion fails
        }
        // Ensure user exists and is valid
        if (!user) {
            return res.status(500).json({
                success: false,
                message: 'User not found after creation/update',
            });
        }
        // Issue backend JWT
        const token = jsonwebtoken_1.default.sign({ id: user._id }, process.env.JWT_SECRET || 'devsecret', { expiresIn: process.env.JWT_EXPIRE || '30d' });
        // Log activity (non-blocking - don't fail if this errors)
        try {
            await (0, activityLogger_1.logActivity)({ userId: user === null || user === void 0 ? void 0 : user._id, action: 'auth.clerkSync', metadata: { email }, req });
        }
        catch (logError) {
            console.error('Error logging activity in clerkSync:', logError);
            // Continue even if logging fails
        }
        res.json({
            success: true,
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                isOnboarded: (_a = user.isOnboarded) !== null && _a !== void 0 ? _a : false,
                marketingSource: user.marketingSource,
            },
        });
    }
    catch (err) {
        console.error('Clerk sync error:', err);
        res.status(500).json({
            success: false,
            message: (err === null || err === void 0 ? void 0 : err.message) || 'Error syncing user from Clerk',
        });
    }
};
exports.clerkSync = clerkSync;
const register = async (req, res) => {
    var _a, _b, _c;
    try {
        const { name, email, password, role } = req.body;
        console.log('Registration attempt:', { name, email, role }); // Log registration attempt
        if (!name || !email || !password || !role) {
            return res.status(400).json({
                success: false,
                message: 'Please provide all required fields',
            });
        }
        if (!['student', 'teacher', 'admin'].includes(role)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid role specified',
            });
        }
        // Check if user exists
        let user = await User_1.default.findOne({ email });
        if (user) {
            return res.status(400).json({
                success: false,
                message: 'User already exists',
            });
        }
        // Create user
        user = await User_1.default.create({
            name,
            email,
            password,
            role,
        });
        // Promote to admin if email allowlisted
        try {
            const allow = (process.env.ADMIN_EMAILS || '')
                .split(',')
                .map((e) => e.trim().toLowerCase())
                .filter(Boolean);
            if (email && allow.includes(email.toLowerCase()) && user.role !== 'admin') {
                user.role = 'admin';
                await user.save();
            }
        }
        catch (_d) { }
        // Promote to admin if email allowlisted
        try {
            const allow = (process.env.ADMIN_EMAILS || '')
                .split(',')
                .map((e) => e.trim().toLowerCase())
                .filter(Boolean);
            if (email && allow.includes(email.toLowerCase()) && user.role !== 'admin') {
                user.role = 'admin';
                await ((_b = (_a = user).save) === null || _b === void 0 ? void 0 : _b.call(_a));
            }
        }
        catch (_e) { }
        // Create token
        const token = jsonwebtoken_1.default.sign({ id: user._id }, process.env.JWT_SECRET || 'devsecret', { expiresIn: process.env.JWT_EXPIRE || '30d' });
        await (0, activityLogger_1.logActivity)({ userId: user === null || user === void 0 ? void 0 : user._id, action: 'auth.register', metadata: { role, email }, req });
        res.status(201).json({
            success: true,
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                isOnboarded: (_c = user.isOnboarded) !== null && _c !== void 0 ? _c : false,
                marketingSource: user.marketingSource,
            },
        });
    }
    catch (err) {
        res.status(500).json({
            success: false,
            message: 'Error in user registration',
        });
    }
};
exports.register = register;
const updateRole = async (req, res) => {
    var _a;
    try {
        const { email, role } = req.body;
        if (!email || !role || !["student", "teacher", "admin"].includes(role)) {
            return res.status(400).json({
                success: false,
                message: "Invalid role or email",
            });
        }
        const user = await User_1.default.findOneAndUpdate({ email }, { role }, { new: true });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }
        await (0, activityLogger_1.logActivity)({ userId: (_a = req === null || req === void 0 ? void 0 : req.user) === null || _a === void 0 ? void 0 : _a._id, action: 'admin.updateRole', metadata: { email, role }, req });
        res.json({
            success: true,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
            },
        });
    }
    catch (err) {
        console.error('Update role error:', err);
        res.status(500).json({
            success: false,
            message: "Error updating user role",
        });
    }
};
exports.updateRole = updateRole;
// Self-service role update: allows users to update their own role
// This is used during role selection, so it doesn't require authentication
// but only allows updating to 'student' or 'teacher' (not 'admin')
const updateMyRole = async (req, res) => {
    try {
        const { email, role } = req.body;
        const currentUser = req === null || req === void 0 ? void 0 : req.user;
        if (!email || !role || !["student", "teacher"].includes(role)) {
            return res.status(400).json({
                success: false,
                message: "Invalid role or email. Only 'student' or 'teacher' roles are allowed.",
            });
        }
        // If user is authenticated, verify they're updating their own email
        if (currentUser && currentUser.email !== email) {
            return res.status(403).json({
                success: false,
                message: "You can only update your own role",
            });
        }
        const user = await User_1.default.findOneAndUpdate({ email }, { role }, { new: true });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }
        await (0, activityLogger_1.logActivity)({ userId: user._id, action: 'user.updateMyRole', metadata: { email, role }, req });
        res.json({
            success: true,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
            },
        });
    }
    catch (err) {
        console.error('Update my role error:', err);
        res.status(500).json({
            success: false,
            message: "Error updating user role",
        });
    }
};
exports.updateMyRole = updateMyRole;
const login = async (req, res) => {
    var _a;
    try {
        const { email, password } = req.body;
        console.log('Login attempt:', { email }); // Log login attempt
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Please provide email and password',
            });
        }
        // Check if user exists
        const user = await User_1.default.findOne({ email }).select('+password');
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials',
            });
        }
        // Check if password matches
        const isMatch = await user.matchPassword(password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials',
            });
        }
        // Create token
        const token = jsonwebtoken_1.default.sign({ id: user._id }, process.env.JWT_SECRET || 'devsecret', { expiresIn: process.env.JWT_EXPIRE || '30d' });
        await (0, activityLogger_1.logActivity)({ userId: user === null || user === void 0 ? void 0 : user._id, action: 'auth.login', metadata: { email }, req });
        res.json({
            success: true,
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                isOnboarded: (_a = user.isOnboarded) !== null && _a !== void 0 ? _a : false,
                marketingSource: user.marketingSource,
            },
        });
    }
    catch (err) {
        res.status(500).json({
            success: false,
            message: 'Error in user login',
        });
    }
};
exports.login = login;
