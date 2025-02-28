// import { NextFunction, Request, Response } from "express";
// import CustomError from "../models/CustomeError";

// const errorHandler = (err: CustomError, req: Request, res: Response, next: NextFunction) => {
//   if (err instanceof CustomError) {
//     return res.status(err.statusCode).json({
//       status: 'error',
//       message: err.message,
//     });
//   }

//   // For unhandled errors (e.g., bugs or exceptions), we return a generic message
//   if (!err.statusCode) {
//     err.statusCode = 500; // Internal Server Error
//     err.message = 'Something went wrong! Please try again later.';
//   }

//   // Log the error stack to the console for debugging in development mode
//   if (process.env.NODE_ENV === 'development') {
//     console.error(err.stack);
//   }

//   // Send the error response
//   res.status(err.statusCode).json({
//     status: 'error',
//     message: err.message,
//     stack: process.env.NODE_ENV === 'development' ? err.stack : undefined, // Send stack trace only in development
//   });
// };

// module.exports = errorHandler;
