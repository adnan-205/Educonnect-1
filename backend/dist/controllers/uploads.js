"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadVideo = exports.uploadImage = void 0;
const cloudinary_1 = __importDefault(require("../utils/cloudinary"));
const uploadImage = async (req, res) => {
    try {
        const folder = req.query.folder || 'educonnect/images';
        const file = req.file;
        if (!file) {
            return res.status(400).json({ success: false, message: 'No file uploaded' });
        }
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
