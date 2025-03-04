export default class HttpException extends Error {
    statusCode;
    success;
    isOperational;
    constructor(statusCode, message) {
        super(message);
        this.statusCode = statusCode;
        this.success = false;
        this.isOperational = true;
        Error.captureStackTrace(this, this.constructor);
    }
}
