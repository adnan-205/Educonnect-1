import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import { logActivity } from '../utils/activityLogger';

// Helper function to generate JWT token
const generateToken = (userId: string) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET || 'devsecret',
    {
      expiresIn: process.env.JWT_EXPIRE || '30d',
    }
  );
};

// Clerk sync: upsert a user by email (coming from Clerk) and return backend JWT
export const clerkSync = async (req: Request, res: Response) => {
  try {
    const { email, name } = req.body as { email?: string; name?: string };

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required',
      });
    }

    // Find or create user
    let user = await User.findOne({ email });

    if (!user) {
      // Default role as student; can be updated later via updateRole
      const generatedPassword = Math.random().toString(36).slice(-12);
      user = await User.create({
        name: name || email.split('@')[0],
        email,
        password: generatedPassword,
        role: 'student',
      });
    }

    // Promote to admin if email allowlisted
    try {
      const allow = (process.env.ADMIN_EMAILS || '')
        .split(',')
        .map(e => e.trim().toLowerCase())
        .filter(Boolean);
      if (email && allow.includes(email.toLowerCase()) && user.role !== 'admin') {
        user.role = 'admin' as any;
        await user.save();
      }
    } catch {}

    // Issue backend JWT
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET || 'devsecret',
      { expiresIn: process.env.JWT_EXPIRE || '30d' }
    );

    await logActivity({ userId: (user as any)?._id, action: 'auth.clerkSync', metadata: { email }, req });

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isOnboarded: (user as any).isOnboarded ?? false,
        marketingSource: (user as any).marketingSource,
      },
    });
  } catch (err) {
    console.error('Clerk sync error:', err);
    res.status(500).json({
      success: false,
      message: 'Error syncing user from Clerk',
    });
  }
};

export const register = async (req: Request, res: Response) => {
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
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({
        success: false,
        message: 'User already exists',
      });
    }

    // Create user
    user = await User.create({
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
        user.role = 'admin' as any;
        await user.save();
      }
    } catch {}

    // Promote to admin if email allowlisted
    try {
      const allow = (process.env.ADMIN_EMAILS || '')
        .split(',')
        .map((e) => e.trim().toLowerCase())
        .filter(Boolean);
      if (email && allow.includes(email.toLowerCase()) && user.role !== 'admin') {
        user.role = 'admin' as any;
        await (user as any).save?.();
      }
    } catch {}

    // Create token
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET || 'devsecret',
      { expiresIn: process.env.JWT_EXPIRE || '30d' }
    );

    await logActivity({ userId: (user as any)?._id, action: 'auth.register', metadata: { role, email }, req });

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isOnboarded: (user as any).isOnboarded ?? false,
        marketingSource: (user as any).marketingSource,
      },
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Error in user registration',
    });
  }
};

export const updateRole = async (req: Request, res: Response) => {
  try {
    const { email, role } = req.body;

    if (!email || !role || !["student", "teacher", "admin"].includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Invalid role or email",
      });
    }

    const user = await User.findOneAndUpdate(
      { email },
      { role },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    await logActivity({ userId: (req as any)?.user?._id, action: 'admin.updateRole', metadata: { email, role } , req });

    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error('Update role error:', err);
    res.status(500).json({
      success: false,
      message: "Error updating user role",
    });
  }
};

export const login = async (req: Request, res: Response) => {
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
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    // Check if password matches
    const isMatch = await (user as any).matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    // Create token
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET || 'devsecret',
      { expiresIn: process.env.JWT_EXPIRE || '30d' }
    );

    await logActivity({ userId: (user as any)?._id, action: 'auth.login', metadata: { email }, req });

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isOnboarded: (user as any).isOnboarded ?? false,
        marketingSource: (user as any).marketingSource,
      },
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Error in user login',
    });
  }
};
