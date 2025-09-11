import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors, { CorsOptions } from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { errorHandler } from './middleware/error';
import authRoutes from './routes/auth';
import gigRoutes from './routes/gigs';
import bookingRoutes from './routes/bookings';
import userRoutes from './routes/users';
import uploadRoutes from './routes/uploads';

// Load env vars
dotenv.config();

// Create Express app
const app = express();

// Body parser (increased limits for image thumbnails, etc.)
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ limit: '5mb', extended: true }));

// Security middleware
app.use(helmet());
// Robust CORS config for local dev and configurable origins
const allowedOriginsFromEnv = (process.env.CORS_ORIGINS || '')
  .split(',')
  .map(o => o.trim())
  .filter(Boolean);
const devOriginRegex = /^http:\/\/(localhost|127\.0\.0\.1):\d+$/;
const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    // Allow same-origin or non-browser requests (no origin)
    if (!origin) return callback(null, true);
    if (allowedOriginsFromEnv.includes(origin)) return callback(null, true);
    if (devOriginRegex.test(origin)) return callback(null, true);
    return callback(new Error(`Not allowed by CORS: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
};
app.use(cors(corsOptions));

// Rate limiting
const limiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Root route
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to EduConnect API',
    endpoints: {
      auth: {
        register: 'POST /api/auth/register',
        login: 'POST /api/auth/login'
      },
      gigs: {
        getAllGigs: 'GET /api/gigs',
        getGig: 'GET /api/gigs/:id',
        createGig: 'POST /api/gigs',
        updateGig: 'PUT /api/gigs/:id',
        deleteGig: 'DELETE /api/gigs/:id'
      },
      bookings: {
        getAllBookings: 'GET /api/bookings',
        getBooking: 'GET /api/bookings/:id',
        createBooking: 'POST /api/bookings',
        updateBookingStatus: 'PUT /api/bookings/:id'
      }
    }
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/gigs', gigRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/users', userRoutes);
app.use('/api/uploads', uploadRoutes);

// Add error logging
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  next(err);
});

// Error handler
app.use(errorHandler);

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI!)
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.log('MongoDB connection error: ' + err));

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});
