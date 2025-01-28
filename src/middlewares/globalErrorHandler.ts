import { Request, Response, NextFunction } from "express";

import HttpException from "../models/HttpException";
import normalizeError from "../utils/normalize_error";

 const globalErrorHandler= () => (error: Error | HttpException, req: Request, res: Response, next: NextFunction) => {
  const normalizedError = normalizeError(error);
  res.status(normalizedError.statusCode).json({
      status_code: normalizedError.statusCode,
      success: normalizedError.success,
      message: normalizedError.message,
    });
}
export default globalErrorHandler