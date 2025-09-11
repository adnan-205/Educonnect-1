import User from '../models/User';
import jwt from 'jsonwebtoken';

export const generateToken = (userId: string): string => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET!, {
    expiresIn: process.env.JWT_EXPIRE,
  });
};

export const findUserByEmail = async (email: string) => {
  return await User.findOne({ email }).select('+password');
};

export const createUser = async (userData: any) => {
  return await User.create(userData);
};

export const getUserProfile = async (userId: string) => {
  return await User.findById(userId).select('-password');
};
