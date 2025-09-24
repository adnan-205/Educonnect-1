import { body, param, query, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';

// Validation error handler
export const handleValidationErrors = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array().map(error => ({
        field: error.type === 'field' ? error.path : 'unknown',
        message: error.msg,
        value: error.type === 'field' ? error.value : undefined
      }))
    });
  }
  next();
};

// User validation rules
export const validateUserRegistration = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Name can only contain letters and spaces'),
  
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  
  body('password')
    .isLength({ min: 8, max: 128 })
    .withMessage('Password must be between 8 and 128 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
  
  body('role')
    .isIn(['student', 'teacher'])
    .withMessage('Role must be either student or teacher'),
  
  handleValidationErrors
];

export const validateUserLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  
  handleValidationErrors
];

// Gig validation rules
export const validateGigCreation = [
  body('title')
    .trim()
    .isLength({ min: 5, max: 100 })
    .withMessage('Title must be between 5 and 100 characters'),
  
  body('description')
    .trim()
    .isLength({ min: 20, max: 2000 })
    .withMessage('Description must be between 20 and 2000 characters'),
  
  body('subject')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Subject must be between 2 and 50 characters'),
  
  body('price')
    .isFloat({ min: 0, max: 10000 })
    .withMessage('Price must be between 0 and 10000'),
  
  body('duration')
    .isInt({ min: 15, max: 480 })
    .withMessage('Duration must be between 15 and 480 minutes'),
  
  body('level')
    .isIn(['beginner', 'intermediate', 'advanced'])
    .withMessage('Level must be beginner, intermediate, or advanced'),
  
  body('category')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Category must be between 2 and 50 characters'),
  
  handleValidationErrors
];

// Booking validation rules
export const validateBookingCreation = [
  // Validate that we have a valid gig ID in either `gig` or `gigId`
  body().custom((_, { req }) => {
    const gigId = req.body.gig || req.body.gigId;
    if (!gigId) {
      throw new Error('gig is required');
    }
    const isObjectId = /^[a-f\d]{24}$/i.test(gigId);
    if (!isObjectId) {
      throw new Error('Invalid gig ID');
    }
    return true;
  }),

  // Either scheduledAt OR (scheduledDate AND scheduledTime) must be provided
  body().custom((_, { req }) => {
    const { scheduledAt, scheduledDate, scheduledTime } = req.body || {};
    if (!scheduledAt && !(scheduledDate && scheduledTime)) {
      throw new Error('Provide either scheduledAt or scheduledDate and scheduledTime');
    }
    return true;
  }),

  // Validate scheduledAt if provided
  body('scheduledAt')
    .optional()
    .isISO8601()
    .withMessage('scheduledAt must be a valid ISO date')
    .custom((value) => {
      const d = new Date(value);
      if (isNaN(d.getTime())) throw new Error('scheduledAt is invalid');
      return true;
    }),

  // Validate scheduledDate if provided
  body('scheduledDate')
    .optional()
    .isISO8601()
    .withMessage('scheduledDate must be a valid ISO date'),

  // Validate scheduledTime if provided (HH:mm)
  body('scheduledTime')
    .optional()
    .matches(/^\d{2}:\d{2}$/)
    .withMessage('scheduledTime must be in HH:mm format'),

  // Optional IANA timezone string
  body('timeZone')
    .optional()
    .isString()
    .isLength({ min: 1, max: 100 })
    .withMessage('timeZone must be a non-empty string'),

  // Optional message
  body('message')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Message cannot exceed 500 characters'),

  handleValidationErrors
];

// Parameter validation
export const validateObjectId = [
  param('id')
    .isMongoId()
    .withMessage('Invalid ID format'),
  
  handleValidationErrors
];

// Query validation
export const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1, max: 1000 })
    .withMessage('Page must be between 1 and 1000'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  
  handleValidationErrors
];

// Profile update validation
export const validateProfileUpdate = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  
  body('bio')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Bio cannot exceed 1000 characters'),
  
  body('phone')
    .optional()
    .isMobilePhone('any')
    .withMessage('Please provide a valid phone number'),
  
  body('location')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Location cannot exceed 100 characters'),
  
  handleValidationErrors
];

// File upload validation
export const validateFileUpload = (req: Request, res: Response, next: NextFunction) => {
  const maxFileSize = parseInt(process.env.MAX_FILE_SIZE || '10485760'); // 10MB default
  const maxFiles = parseInt(process.env.MAX_FILES_PER_REQUEST || '5');
  
  if (!req.file && !req.files) {
    return res.status(400).json({
      success: false,
      error: 'No file uploaded'
    });
  }
  
  const files = req.files ? (Array.isArray(req.files) ? req.files : [req.file]) : [req.file];
  
  if (files.length > maxFiles) {
    return res.status(400).json({
      success: false,
      error: `Maximum ${maxFiles} files allowed per request`
    });
  }
  
  for (const file of files) {
    if (file && file.size > maxFileSize) {
      return res.status(400).json({
        success: false,
        error: `File size cannot exceed ${Math.round(maxFileSize / 1024 / 1024)}MB`
      });
    }
  }
  
  next();
};
