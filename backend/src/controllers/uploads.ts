import { Request, Response } from 'express';
import cloudinary from '../utils/cloudinary';
import Gig from '../models/Gig';

export const uploadImage = async (req: Request, res: Response) => {
  try {
    console.log('Upload image request received:', {
      query: req.query,
      headers: req.headers,
      user: (req as any).user?.email,
      fileExists: !!(req as any).file
    });
    
    const folder = (req.query.folder as string) || 'educonnect/images';
    const file = (req as any).file as any;

    if (!file) {
      console.log('No file in request');
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    console.log('File details:', {
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      bufferLength: file.buffer?.length
    });

    const result = await new Promise<any>((resolve, reject) => {
      const cldStream = cloudinary.uploader.upload_stream(
        { folder, resource_type: 'image' },
        (error: any, result: any) => {
          if (error) return reject(error);
          resolve(result);
        }
      );
      // Support Multer v1 (memoryStorage -> buffer) and v2 (stream)
      if (file?.buffer) {
        cldStream.end(file.buffer);
      } else if (file?.stream) {
        file.stream.pipe(cldStream);
      } else {
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
  } catch (err: any) {
    console.error('Upload image error:', err);
    res.status(500).json({ success: false, message: 'Error uploading image', details: err?.message || String(err) });
  }
};

export const deleteGigThumbnail = async (req: Request, res: Response) => {
  try {
    const gigId = (req.query.gigId as string) || '';
    if (!gigId) {
      return res.status(400).json({ success: false, message: 'gigId query parameter is required' });
    }

    const gig = await Gig.findById(gigId);
    if (!gig) {
      return res.status(404).json({ success: false, message: 'Gig not found' });
    }
    if (gig.teacher.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    const publicId = (gig as any).thumbnailPublicId as string | undefined;
    if (publicId) {
      try {
        await cloudinary.uploader.destroy(publicId, { resource_type: 'image' });
      } catch {
        // ignore cloudinary deletion errors
      }
    }

    (gig as any).thumbnailUrl = undefined;
    (gig as any).thumbnailPublicId = undefined;
    await gig.save();

    return res.json({ success: true, message: 'Thumbnail removed', gig });
  } catch (err: any) {
    console.error('Delete gig thumbnail error:', err);
    return res.status(500).json({ success: false, message: 'Error removing gig thumbnail', details: err?.message || String(err) });
  }
};

export const uploadGigThumbnail = async (req: Request, res: Response) => {
  try {
    const gigId = (req.query.gigId as string) || '';
    if (!gigId) {
      return res.status(400).json({ success: false, message: 'gigId query parameter is required' });
    }

    const file = (req as any).file as any;
    if (!file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    // Permission check: only the gig's teacher can upload thumbnail for it
    const gig = await Gig.findById(gigId);
    if (!gig) {
      return res.status(404).json({ success: false, message: 'Gig not found' });
    }
    if (gig.teacher.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    // Upload to a dedicated folder for gig thumbnails
    const folder = 'educonnect/gigs/thumbnails';

    const result = await new Promise<any>((resolve, reject) => {
      const cldStream = cloudinary.uploader.upload_stream(
        { folder, resource_type: 'image' },
        (error: any, result: any) => {
          if (error) return reject(error);
          resolve(result);
        }
      );
      if (file?.buffer) {
        cldStream.end(file.buffer);
      } else if (file?.stream) {
        file.stream.pipe(cldStream);
      } else {
        reject(new Error('Invalid uploaded file: missing buffer/stream'));
      }
    });

    // Update the gig document with thumbnail URL and public id; cleanup old if present
    const oldPublicId = (gig as any).thumbnailPublicId as string | undefined;
    gig.thumbnailUrl = result.secure_url;
    (gig as any).thumbnailPublicId = result.public_id;
    await gig.save();
    if (oldPublicId && oldPublicId !== result.public_id) {
      try {
        await cloudinary.uploader.destroy(oldPublicId, { resource_type: 'image' });
      } catch {
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
  } catch (err: any) {
    console.error('Upload gig thumbnail error:', err);
    res.status(500).json({ success: false, message: 'Error uploading gig thumbnail', details: err?.message || String(err) });
  }
};

export const uploadVideo = async (req: Request, res: Response) => {
  try {
    const folder = (req.query.folder as string) || 'educonnect/videos';
    const file = (req as any).file as any;

    if (!file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const result = await new Promise<any>((resolve, reject) => {
      const cldStream = cloudinary.uploader.upload_stream(
        { folder, resource_type: 'video' },
        (error: any, result: any) => {
          if (error) return reject(error);
          resolve(result);
        }
      );
      if (file?.buffer) {
        cldStream.end(file.buffer);
      } else if (file?.stream) {
        file.stream.pipe(cldStream);
      } else {
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
  } catch (err: any) {
    console.error('Upload video error:', err);
    res.status(500).json({ success: false, message: 'Error uploading video', details: err?.message || String(err) });
  }
};
