import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors, { CorsOptions } from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import compression from 'compression';
import { errorHandler } from './middleware/error';
import { requestLogger } from './middleware/logger';
import authRoutes from './routes/auth';
import gigRoutes from './routes/gigs';
import bookingRoutes from './routes/bookings';
import userRoutes from './routes/users';
import uploadRoutes from './routes/uploads';
import healthRoutes from './routes/health';
import paymentRoutes from './routes/payments';
import reviewRoutes from './routes/reviews';
import walletRoutes from './routes/wallet';
import adminRoutes from './routes/admin';

// Load env vars
dotenv.config();

// Create Express app
const app = express();

// Trust proxy for production deployments behind reverse proxy
if (process.env.TRUST_PROXY === 'true') {
  app.set('trust proxy', 1);
}

// Request logging middleware
app.use(requestLogger);

// Compression middleware for better performance
app.use(compression());

// Body parser with configurable limits
const maxFileSize = process.env.MAX_FILE_SIZE || '5mb';
app.use(express.json({ limit: maxFileSize }));
app.use(express.urlencoded({ limit: maxFileSize, extended: true }));

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false, // Disable CSP for now to avoid conflicts
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

// NoSQL injection protection (Express 5 compatible)
// express-mongo-sanitize attempts to reassign req.query which is readonly in Express 5.
// We implement a safe in-place sanitizer instead.
const removeUnsafeKeys = (obj: any) => {
  if (!obj || typeof obj !== 'object') return;
  for (const key of Object.keys(obj)) {
    if (key.startsWith('$') || key.includes('.')) {
      delete (obj as any)[key];
      continue;
    }
    const val = (obj as any)[key];
    if (val && typeof val === 'object') removeUnsafeKeys(val);
  }
};
app.use((req, _res, next) => {
  try {
    if (req.body && typeof req.body === 'object') removeUnsafeKeys(req.body);
    if (req.query && typeof req.query === 'object') removeUnsafeKeys(req.query as any);
    if (req.params && typeof req.params === 'object') removeUnsafeKeys(req.params as any);
  } catch {
    // ignore sanitize errors
  }
  next();
});
// Robust CORS config for local dev and configurable origins
const corsEnv = process.env.CORS_ORIGINS || process.env.CORS_ORIGIN || '';
const allowedOriginsFromEnv = corsEnv
  .split(',')
  .map(o => o.trim())
  .filter(Boolean);

// Allow common local dev origins: localhost, 127.0.0.1, and typical LAN IP ranges
const devOriginRegex = /^http:\/\/(localhost|127\.0\.0\.1|192\.168\.[0-9]{1,3}\.[0-9]{1,3}|10\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}|172\.(1[6-9]|2[0-9]|3[0-1])\.[0-9]{1,3}\.[0-9]{1,3}):\d+$/;

// Render.com specific patterns
const renderOriginRegex = /^https:\/\/.*\.onrender\.com$/;
// SSLCommerz origins (sandbox and live)
const sslcommerzOriginRegex = /^https:\/\/(sandbox|securepay)\.sslcommerz\.com$/;

const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    // Allow same-origin or non-browser requests (no origin)
    if (!origin) return callback(null, true);

    // Some providers (payment redirects/form posts, file://) use literal 'null' origin.
    // Allow it to enable gateway callbacks like SSLCommerz success/fail/cancel.
    if (origin === 'null') return callback(null, true);

    // Allow configured origins
    if (allowedOriginsFromEnv.includes(origin)) return callback(null, true);

    // Allow development origins
    if (process.env.NODE_ENV === 'development' && devOriginRegex.test(origin)) {
      return callback(null, true);
    }

    // Allow Render.com subdomains
    if (renderOriginRegex.test(origin)) return callback(null, true);

    // Allow SSLCommerz gateways to POST callbacks
    if (sslcommerzOriginRegex.test(origin)) return callback(null, true);

    return callback(new Error(`Not allowed by CORS: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With'],
};
app.use(cors(corsOptions));

// Enhanced rate limiting with configurable options
const isDev = process.env.NODE_ENV === 'development';
const rateLimitWindow = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'); // 15 minutes default
const rateLimitMax = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || (isDev ? '1000' : '100'));

const limiter = rateLimit({
  windowMs: rateLimitWindow,
  max: rateLimitMax,
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: Math.ceil(rateLimitWindow / 1000)
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // In development, skip rate limiting entirely to avoid disrupting local testing
    if (isDev) return true;
    // Skip rate limiting for health checks
    return req.path === '/health' || req.path === '/api/health';
  }
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
      },
      reviews: {
        list: 'GET /api/reviews?gig=&teacher=&student=',
        getOne: 'GET /api/reviews/:id',
        updateOwn: 'PUT /api/reviews/:id',
        delete: 'DELETE /api/reviews/:id',
        listForGig: 'GET /api/gigs/:gigId/reviews',
        getMyForGig: 'GET /api/gigs/:gigId/reviews/me',
        createForGig: 'POST /api/gigs/:gigId/reviews'
      },
      payments: {
        init: 'POST /api/payments/init',
        status: 'GET /api/payments/status/:gigId',
        success: 'POST /api/payments/success/:tran_id',
        fail: 'POST /api/payments/fail/:tran_id',
        cancel: 'POST /api/payments/cancel/:tran_id',
        ipn: 'POST /api/payments/ipn'
      },
      wallet: {
        balance: 'GET /api/wallet/balance (Teacher)',
        transactions: 'GET /api/wallet/transactions (Teacher)',
        withdraw: 'POST /api/wallet/withdraw (Teacher)',
        pendingWithdrawals: 'GET /api/wallet/admin/withdrawals/pending (Admin)',
        approveWithdrawal: 'PUT /api/wallet/admin/withdrawals/:id/approve (Admin)',
        rejectWithdrawal: 'PUT /api/wallet/admin/withdrawals/:id/reject (Admin)',
        stats: 'GET /api/wallet/admin/stats (Admin)'
      }
    }
  });
});

// Health check routes (before authentication)
app.use('/health', healthRoutes);
app.use('/api/health', healthRoutes);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/gigs', gigRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/users', userRoutes);
app.use('/api/uploads', uploadRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/admin', adminRoutes);

// Add error logging
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  next(err);
});

// Error handler
app.use(errorHandler);

// Enhanced MongoDB connection with production settings
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI!, {
      maxPoolSize: parseInt(process.env.DB_MAX_POOL_SIZE || '10'),
      minPoolSize: parseInt(process.env.DB_MIN_POOL_SIZE || '5'),
      maxIdleTimeMS: parseInt(process.env.DB_MAX_IDLE_TIME_MS || '30000'),
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      bufferCommands: false
    });
    
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    
    // Handle connection events
    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
    });
    
    mongoose.connection.on('disconnected', () => {
      console.warn('MongoDB disconnected');
    });
    
    // Graceful shutdown
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('MongoDB connection closed through app termination');
      process.exit(0);
    });
    
  } catch (error) {
    console.error('MongoDB connection failed:', error);
    process.exit(1);
  }
};

connectDB();

// Start server
const PORT = parseInt(process.env.PORT || '5000', 10);
const HOST = process.env.NODE_ENV === 'production' ? '0.0.0.0' : 'localhost';

app.listen(PORT, HOST, () => {
  console.log(`Server is running in ${process.env.NODE_ENV} mode on ${HOST}:${PORT}`);
});
