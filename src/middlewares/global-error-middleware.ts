import { Request, Response, NextFunction } from 'express';
import HttpException from '../models/exceptions.js';

export const globalErrorHandler = (
    err: Error,
    req: Request,
    res: Response,
    next: NextFunction
) => {
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