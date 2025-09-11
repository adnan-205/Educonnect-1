import { Request } from 'express';
import { IUser } from './models';

export interface AuthRequest extends Request {
  user?: IUser;
}

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
  role: 'student' | 'teacher';
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface GigInput {
  title: string;
  description: string;
  price: number;
  category: string;
  duration: number;
  availability: {
    days: string[];
    times: string[];
  };
}

export interface BookingInput {
  gig: string;
  scheduledDate: Date;
  scheduledTime: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  token?: string;
}
