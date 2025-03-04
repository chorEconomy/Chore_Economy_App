class CustomError extends Error {
    statusCode;
    isOperational;
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = true; // Flag to differentiate between operational errors and programming bugs
        Error.captureStackTrace(this, this.constructor);
    }
}
export default CustomError;
