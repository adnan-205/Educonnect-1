"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserProfile = exports.createUser = exports.findUserByEmail = exports.generateToken = void 0;
const User_1 = __importDefault(require("../models/User"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const generateToken = (userId) => {
    return jsonwebtoken_1.default.sign({ id: userId }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE,
    });
};
exports.generateToken = generateToken;
const findUserByEmail = async (email) => {
    return await User_1.default.findOne({ email }).select('+password');
};
exports.findUserByEmail = findUserByEmail;
const createUser = async (userData) => {
    return await User_1.default.create(userData);
};
exports.createUser = createUser;
const getUserProfile = async (userId) => {
    return await User_1.default.findById(userId).select('-password');
};
exports.getUserProfile = getUserProfile;
