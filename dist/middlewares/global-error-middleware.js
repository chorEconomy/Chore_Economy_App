import HttpException from '../models/exceptions.js';
export const globalErrorHandler = (err, req, res, next) => {
    console.error(err.stack);
    let statusCode = 500;
    let message = 'Internal Server Error';
    if (err instanceof HttpException) {
        statusCode = err.statusCode;
        message = err.message;
    }
    res.status(statusCode).json({
        success: false,
        message: message,
        stack: process.env.NODE_ENV === 'production' ? undefined : err.stack, // Only include stack in development
    });
};
