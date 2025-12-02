"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadVideo = exports.uploadGigThumbnail = exports.deleteGigThumbnail = exports.uploadImage = void 0;
const cloudinary_1 = __importDefault(require("../utils/cloudinary"));
const Gig_1 = __importDefault(require("../models/Gig"));
const uploadImage = async (req, res) => {
    var _a, _b;
    try {
        console.log('Upload image request received:', {
            query: req.query,
            headers: req.headers,
            user: (_a = req.user) === null || _a === void 0 ? void 0 : _a.email,
            fileExists: !!req.file
        });
        const folder = req.query.folder || 'educonnect/images';
        const file = req.file;
        if (!file) {
            console.log('No file in request');
            return res.status(400).json({ success: false, message: 'No file uploaded' });
        }
        console.log('File details:', {
            originalname: file.originalname,
            mimetype: file.mimetype,
            size: file.size,
            bufferLength: (_b = file.buffer) === null || _b === void 0 ? void 0 : _b.length
        });
        const result = await new Promise((resolve, reject) => {
            const cldStream = cloudinary_1.default.uploader.upload_stream({ folder, resource_type: 'image' }, (error, result) => {
                if (error)
                    return reject(error);
                resolve(result);
            });
            // Support Multer v1 (memoryStorage -> buffer) and v2 (stream)
            if (file === null || file === void 0 ? void 0 : file.buffer) {
                cldStream.end(file.buffer);
            }
            else if (file === null || file === void 0 ? void 0 : file.stream) {
                file.stream.pipe(cldStream);
            }
            else {
                reject(new Error('Invalid uploaded file: missing buffer/stream'));
            }
        });
        console.log('Cloudinary upload successful:', {
            url: result.secure_url,
            public_id: result.public_id,
            bytes: result.bytes
        });
        res.json({
            success: true,
            data: {
                url: result.secure_url,
                public_id: result.public_id,
                width: result.width,
                height: result.height,
                bytes: result.bytes,
                format: result.format,
            },
        });
    }
    catch (err) {
        console.error('Upload image error:', err);
        res.status(500).json({ success: false, message: 'Error uploading image', details: (err === null || err === void 0 ? void 0 : err.message) || String(err) });
    }
};
exports.uploadImage = uploadImage;
const deleteGigThumbnail = async (req, res) => {
    try {
        const gigId = req.query.gigId || '';
        if (!gigId) {
            return res.status(400).json({ success: false, message: 'gigId query parameter is required' });
        }
        const gig = await Gig_1.default.findById(gigId);
        if (!gig) {
            return res.status(404).json({ success: false, message: 'Gig not found' });
        }
        if (gig.teacher.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Forbidden' });
        }
        const publicId = gig.thumbnailPublicId;
        if (publicId) {
            try {
                await cloudinary_1.default.uploader.destroy(publicId, { resource_type: 'image' });
            }
            catch (_a) {
                // ignore cloudinary deletion errors
            }
        }
        gig.thumbnailUrl = undefined;
        gig.thumbnailPublicId = undefined;
        await gig.save();
        return res.json({ success: true, message: 'Thumbnail removed', gig });
    }
    catch (err) {
        console.error('Delete gig thumbnail error:', err);
        return res.status(500).json({ success: false, message: 'Error removing gig thumbnail', details: (err === null || err === void 0 ? void 0 : err.message) || String(err) });
    }
};
exports.deleteGigThumbnail = deleteGigThumbnail;
const uploadGigThumbnail = async (req, res) => {
    try {
        const gigId = req.query.gigId || '';
        if (!gigId) {
            return res.status(400).json({ success: false, message: 'gigId query parameter is required' });
        }
        const file = req.file;
        if (!file) {
            return res.status(400).json({ success: false, message: 'No file uploaded' });
        }
        // Permission check: only the gig's teacher can upload thumbnail for it
        const gig = await Gig_1.default.findById(gigId);
        if (!gig) {
            return res.status(404).json({ success: false, message: 'Gig not found' });
        }
        if (gig.teacher.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Forbidden' });
        }
        // Upload to a dedicated folder for gig thumbnails
        const folder = 'educonnect/gigs/thumbnails';
        const result = await new Promise((resolve, reject) => {
            const cldStream = cloudinary_1.default.uploader.upload_stream({ folder, resource_type: 'image' }, (error, result) => {
                if (error)
                    return reject(error);
                resolve(result);
            });
            if (file === null || file === void 0 ? void 0 : file.buffer) {
                cldStream.end(file.buffer);
            }
            else if (file === null || file === void 0 ? void 0 : file.stream) {
                file.stream.pipe(cldStream);
            }
            else {
                reject(new Error('Invalid uploaded file: missing buffer/stream'));
            }
        });
        // Update the gig document with thumbnail URL and public id; cleanup old if present
        const oldPublicId = gig.thumbnailPublicId;
        gig.thumbnailUrl = result.secure_url;
        gig.thumbnailPublicId = result.public_id;
        await gig.save();
        if (oldPublicId && oldPublicId !== result.public_id) {
            try {
                await cloudinary_1.default.uploader.destroy(oldPublicId, { resource_type: 'image' });
            }
            catch (_a) {
                // ignore cleanup failures
            }
        }
        res.json({
            success: true,
            data: {
                url: result.secure_url,
                public_id: result.public_id,
                width: result.width,
                height: result.height,
                bytes: result.bytes,
                format: result.format,
            },
            gig,
        });
    }
    catch (err) {
        console.error('Upload gig thumbnail error:', err);
        res.status(500).json({ success: false, message: 'Error uploading gig thumbnail', details: (err === null || err === void 0 ? void 0 : err.message) || String(err) });
    }
};
exports.uploadGigThumbnail = uploadGigThumbnail;
const uploadVideo = async (req, res) => {
    try {
        const folder = req.query.folder || 'educonnect/videos';
        const file = req.file;
        if (!file) {
            return res.status(400).json({ success: false, message: 'No file uploaded' });
        }
        const result = await new Promise((resolve, reject) => {
            const cldStream = cloudinary_1.default.uploader.upload_stream({ folder, resource_type: 'video' }, (error, result) => {
                if (error)
                    return reject(error);
                resolve(result);
            });
            if (file === null || file === void 0 ? void 0 : file.buffer) {
                cldStream.end(file.buffer);
            }
            else if (file === null || file === void 0 ? void 0 : file.stream) {
                file.stream.pipe(cldStream);
            }
            else {
                reject(new Error('Invalid uploaded file: missing buffer/stream'));
            }
        });
        res.json({
            success: true,
            data: {
                url: result.secure_url,
                public_id: result.public_id,
                bytes: result.bytes,
                format: result.format,
                duration: result.duration,
            },
        });
    }
    catch (err) {
        console.error('Upload video error:', err);
        res.status(500).json({ success: false, message: 'Error uploading video', details: (err === null || err === void 0 ? void 0 : err.message) || String(err) });
    }
};
exports.uploadVideo = uploadVideo;
