import HttpException from "../models/HttpException.js";

export default function normalizeError(error: Error | HttpException): HttpException {
    if (error instanceof HttpException) {
      return error;
    }
    return new HttpException(500, error.message || 'An unexpected error occurred');
}
  