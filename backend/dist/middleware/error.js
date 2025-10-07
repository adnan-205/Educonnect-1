"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const errorHandler = (err, req, res, next) => {
    let error = { ...err };
    error.message = err.message;
    // Log error
    const timestamp = new Date().toISOString();
    console.error(`[${timestamp}] ERROR ${req.method} ${req.url}:`, {
        message: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        body: req.body,
        params: req.params,
        query: req.query
    });
    // Mongoose bad ObjectId
    if (err.name === 'CastError') {
        const message = 'Resource not found';
        error = { ...error, message, statusCode: 404 };
    }
    // Mongoose duplicate key
    if (err.code === 11000) {
        const message = 'Duplicate field value entered';
        error = { ...error, message, statusCode: 400 };
    }
    // Mongoose validation error
    if (err.name === 'ValidationError') {
        const message = Object.values(err.errors || {}).map((val) => val.message).join(', ');
        error = { ...error, message, statusCode: 400 };
    }
    // JWT errors
    if (err.name === 'JsonWebTokenError') {
        const message = 'Invalid token';
        error = { ...error, message, statusCode: 401 };
    }
    if (err.name === 'TokenExpiredError') {
        const message = 'Token expired';
        error = { ...error, message, statusCode: 401 };
    }
    // Rate limit error
    if (err.statusCode === 429) {
        error.message = 'Too many requests, please try again later';
    }
    const response = {
        success: false,
        error: error.message || 'Server Error',
        timestamp: new Date().toISOString(),
        path: req.path,
        method: req.method
    };
    // Include stack trace in development
    if (process.env.NODE_ENV === 'development') {
        response.stack = error.stack;
    }
    // Include request ID if available
    if (req.headers['x-request-id']) {
        response.requestId = req.headers['x-request-id'];
    }
    res.status(error.statusCode || 500).json(response);
};
exports.errorHandler = errorHandler;
