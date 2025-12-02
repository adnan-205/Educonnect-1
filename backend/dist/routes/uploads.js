"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const multer_1 = __importDefault(require("multer"));
const auth_1 = require("../middleware/auth");
const uploads_1 = require("../controllers/uploads");
const router = express_1.default.Router();
const storage = multer_1.default.memoryStorage();
const imageUpload = (0, multer_1.default)({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
    fileFilter: (_req, file, cb) => {
        if (/^image\/(png|jpe?g|gif|webp|bmp|tiff|svg\+xml)$/i.test(file.mimetype)) {
            cb(null, true);
        }
        else {
            cb(new Error('Invalid image file type'));
        }
    },
});
const videoUpload = (0, multer_1.default)({
    storage,
    limits: { fileSize: 100 * 1024 * 1024 }, // 100 MB
    fileFilter: (_req, file, cb) => {
        if (/^video\//i.test(file.mimetype)) {
            cb(null, true);
        }
        else {
            cb(new Error('Invalid video file type'));
        }
    },
});
router.post('/image', auth_1.protect, imageUpload.single('file'), uploads_1.uploadImage);
router.post('/video', auth_1.protect, videoUpload.single('file'), uploads_1.uploadVideo);
router.post('/gig-thumbnail', auth_1.protect, imageUpload.single('file'), uploads_1.uploadGigThumbnail);
router.delete('/gig-thumbnail', auth_1.protect, uploads_1.deleteGigThumbnail);
exports.default = router;
