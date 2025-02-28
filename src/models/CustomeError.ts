
class CustomError extends Error {
    statusCode: number
    isOperational: boolean
    constructor(message: string, statusCode: number) {
      super(message);
      this.statusCode = statusCode;
      this.isOperational = true;  // Flag to differentiate between operational errors and programming bugs
      Error.captureStackTrace(this, this.constructor);
    }
  }

  export default CustomError