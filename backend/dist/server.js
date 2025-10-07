"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const compression_1 = __importDefault(require("compression"));
const error_1 = require("./middleware/error");
const logger_1 = require("./middleware/logger");
const auth_1 = __importDefault(require("./routes/auth"));
const gigs_1 = __importDefault(require("./routes/gigs"));
const bookings_1 = __importDefault(require("./routes/bookings"));
const users_1 = __importDefault(require("./routes/users"));
const uploads_1 = __importDefault(require("./routes/uploads"));
const health_1 = __importDefault(require("./routes/health"));
// Load env vars
dotenv_1.default.config();
// Create Express app
const app = (0, express_1.default)();
// Trust proxy for production deployments behind reverse proxy
if (process.env.TRUST_PROXY === 'true') {
    app.set('trust proxy', 1);
}
// Request logging middleware
app.use(logger_1.requestLogger);
// Compression middleware for better performance
app.use((0, compression_1.default)());
// Body parser with configurable limits
const maxFileSize = process.env.MAX_FILE_SIZE || '5mb';
app.use(express_1.default.json({ limit: maxFileSize }));
app.use(express_1.default.urlencoded({ limit: maxFileSize, extended: true }));
// Security middleware
app.use((0, helmet_1.default)({
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
const removeUnsafeKeys = (obj) => {
    if (!obj || typeof obj !== 'object')
        return;
    for (const key of Object.keys(obj)) {
        if (key.startsWith('$') || key.includes('.')) {
            delete obj[key];
            continue;
        }
        const val = obj[key];
        if (val && typeof val === 'object')
            removeUnsafeKeys(val);
    }
};
app.use((req, _res, next) => {
    try {
        if (req.body && typeof req.body === 'object')
            removeUnsafeKeys(req.body);
        if (req.query && typeof req.query === 'object')
            removeUnsafeKeys(req.query);
        if (req.params && typeof req.params === 'object')
            removeUnsafeKeys(req.params);
    }
    catch (_a) {
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
const corsOptions = {
    origin: (origin, callback) => {
        // Allow same-origin or non-browser requests (no origin)
        if (!origin)
            return callback(null, true);
        // Allow configured origins
        if (allowedOriginsFromEnv.includes(origin))
            return callback(null, true);
        // Allow development origins
        if (process.env.NODE_ENV === 'development' && devOriginRegex.test(origin)) {
            return callback(null, true);
        }
        // Allow Render.com subdomains
        if (renderOriginRegex.test(origin))
            return callback(null, true);
        return callback(new Error(`Not allowed by CORS: ${origin}`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With'],
};
app.use((0, cors_1.default)(corsOptions));
// Enhanced rate limiting with configurable options
const rateLimitWindow = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'); // 15 minutes default
const rateLimitMax = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100');
const limiter = (0, express_rate_limit_1.default)({
    windowMs: rateLimitWindow,
    max: rateLimitMax,
    message: {
        error: 'Too many requests from this IP, please try again later.',
        retryAfter: Math.ceil(rateLimitWindow / 1000)
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => {
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
            }
        }
    });
});
// Health check routes (before authentication)
app.use('/health', health_1.default);
app.use('/api/health', health_1.default);
// Routes
app.use('/api/auth', auth_1.default);
app.use('/api/gigs', gigs_1.default);
app.use('/api/bookings', bookings_1.default);
app.use('/api/users', users_1.default);
app.use('/api/uploads', uploads_1.default);
// Add error logging
app.use((err, req, res, next) => {
    console.error('Error:', err);
    next(err);
});
// Error handler
app.use(error_1.errorHandler);
// Enhanced MongoDB connection with production settings
const connectDB = async () => {
    try {
        const conn = await mongoose_1.default.connect(process.env.MONGODB_URI, {
            maxPoolSize: parseInt(process.env.DB_MAX_POOL_SIZE || '10'),
            minPoolSize: parseInt(process.env.DB_MIN_POOL_SIZE || '5'),
            maxIdleTimeMS: parseInt(process.env.DB_MAX_IDLE_TIME_MS || '30000'),
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
            bufferCommands: false
        });
        console.log(`MongoDB Connected: ${conn.connection.host}`);
        // Handle connection events
        mongoose_1.default.connection.on('error', (err) => {
            console.error('MongoDB connection error:', err);
        });
        mongoose_1.default.connection.on('disconnected', () => {
            console.warn('MongoDB disconnected');
        });
        // Graceful shutdown
        process.on('SIGINT', async () => {
            await mongoose_1.default.connection.close();
            console.log('MongoDB connection closed through app termination');
            process.exit(0);
        });
    }
    catch (error) {
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
