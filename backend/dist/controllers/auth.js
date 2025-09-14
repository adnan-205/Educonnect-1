"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.login = exports.updateRole = exports.register = exports.clerkSync = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_1 = __importDefault(require("../models/User"));
// Helper function to generate JWT token
const generateToken = (userId) => {
    return jsonwebtoken_1.default.sign({ id: userId }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE,
    });
};
// Clerk sync: upsert a user by email (coming from Clerk) and return backend JWT
const clerkSync = async (req, res) => {
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
            user = await User_1.default.create({
                name: name || email.split('@')[0],
                email,
                password: generatedPassword,
                role: 'student',
            });
        }
        // Issue backend JWT
        const token = jsonwebtoken_1.default.sign({ id: user._id }, process.env.JWT_SECRET, {
            expiresIn: process.env.JWT_EXPIRE,
        });
        res.json({
            success: true,
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
            },
        });
    }
    catch (err) {
        console.error('Clerk sync error:', err);
        res.status(500).json({
            success: false,
            message: 'Error syncing user from Clerk',
        });
    }
};
exports.clerkSync = clerkSync;
const register = async (req, res) => {
    try {
        const { name, email, password, role } = req.body;
        console.log('Registration attempt:', { name, email, role }); // Log registration attempt
        if (!name || !email || !password || !role) {
            return res.status(400).json({
                success: false,
                message: 'Please provide all required fields',
            });
        }
        if (!['student', 'teacher'].includes(role)) {
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
        // Create token
        const token = jsonwebtoken_1.default.sign({ id: user._id }, process.env.JWT_SECRET, {
            expiresIn: process.env.JWT_EXPIRE,
        });
        res.status(201).json({
            success: true,
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
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
    try {
        const { email, role } = req.body;
        if (!email || !role || !["student", "teacher"].includes(role)) {
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
const login = async (req, res) => {
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
        const token = jsonwebtoken_1.default.sign({ id: user._id }, process.env.JWT_SECRET, {
            expiresIn: process.env.JWT_EXPIRE,
        });
        res.json({
            success: true,
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
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
