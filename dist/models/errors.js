import HttpException from "./exceptions.js";
export class NotFoundError extends HttpException {
    constructor(message = 'Resource not found') {
        super(404, message);
    }
}
export class UnauthorizedError extends HttpException {
    constructor(message = 'Unauthorized access') {
        super(401, message);
    }
}
export class ForbiddenError extends HttpException {
    constructor(message = 'Forbidden') {
        super(403, message);
    }
}
export class BadRequestError extends HttpException {
    constructor(message = 'Bad Request') {
        super(400, message);
    }
}
export class UnprocessableEntityError extends HttpException {
    constructor(message = 'Unprocessible Entity') {
        super(422, message);
    }
}
