import { Request, Response } from 'express';
import cloudinary from '../utils/cloudinary';

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
