export default class HttpException extends Error {
    public statusCode: number
    success: boolean
    isOperational: boolean

    constructor(statusCode: number, message: string) {
        super(message);
        this.statusCode = statusCode 
        this.success = false
        this.isOperational = true

        Error.captureStackTrace(this, this.constructor)
    }
}