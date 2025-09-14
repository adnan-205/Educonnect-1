"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorLogger = exports.requestLogger = void 0;
const requestLogger = (req, res, next) => {
    const start = Date.now();
    const timestamp = new Date().toISOString();
    // Log request
    console.log(`[${timestamp}] ${req.method} ${req.url} - IP: ${req.ip}`);
    // Log response when finished
    res.on('finish', () => {
        const duration = Date.now() - start;
        const logLevel = res.statusCode >= 400 ? 'ERROR' : 'INFO';
        console.log(`[${timestamp}] ${logLevel} ${req.method} ${req.url} - ${res.statusCode} - ${duration}ms`);
    });
    next();
};
exports.requestLogger = requestLogger;
const errorLogger = (error, req, res, next) => {
    const timestamp = new Date().toISOString();
    console.error(`[${timestamp}] ERROR ${req.method} ${req.url}:`, {
        message: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
        ip: req.ip,
        userAgent: req.get('User-Agent')
    });
    next(error);
};
exports.errorLogger = errorLogger;
