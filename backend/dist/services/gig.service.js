"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchGigs = exports.updateGig = exports.createGig = exports.findGigById = exports.findGigsByTeacher = void 0;
const Gig_1 = __importDefault(require("../models/Gig"));
const findGigsByTeacher = async (teacherId) => {
    return await Gig_1.default.find({ teacher: teacherId });
};
exports.findGigsByTeacher = findGigsByTeacher;
const findGigById = async (gigId) => {
    return await Gig_1.default.findById(gigId).populate('teacher', 'name email');
};
exports.findGigById = findGigById;
const createGig = async (gigData) => {
    return await Gig_1.default.create(gigData);
};
exports.createGig = createGig;
const updateGig = async (gigId, updateData) => {
    return await Gig_1.default.findByIdAndUpdate(gigId, updateData, {
        new: true,
        runValidators: true,
    });
};
exports.updateGig = updateGig;
const searchGigs = async (query) => {
    const { category, priceMin, priceMax, ...rest } = query;
    let searchQuery = { ...rest };
    if (category) {
        searchQuery.category = category;
    }
    if (priceMin || priceMax) {
        searchQuery.price = {};
        if (priceMin)
            searchQuery.price.$gte = priceMin;
        if (priceMax)
            searchQuery.price.$lte = priceMax;
    }
    return await Gig_1.default.find(searchQuery).populate('teacher', 'name email');
};
exports.searchGigs = searchGigs;
