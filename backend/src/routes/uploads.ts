import express from 'express';
import multer from 'multer';
import { protect } from '../middleware/auth';
import { uploadImage, uploadVideo, uploadGigThumbnail, deleteGigThumbnail } from '../controllers/uploads';

const router = express.Router();

const storage = multer.memoryStorage();

const imageUpload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (_req: any, file: any, cb: any) => {
    if (/^image\/(png|jpe?g|gif|webp|bmp|tiff|svg\+xml)$/i.test(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid image file type'));
    }
  },
});

const videoUpload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100 MB
  fileFilter: (_req: any, file: any, cb: any) => {
    if (/^video\//i.test(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid video file type'));
    }
  },
});

router.post('/image', protect, imageUpload.single('file'), uploadImage);
router.post('/video', protect, videoUpload.single('file'), uploadVideo);
router.post('/gig-thumbnail', protect, imageUpload.single('file'), uploadGigThumbnail);
router.delete('/gig-thumbnail', protect, deleteGigThumbnail);

export default router;
