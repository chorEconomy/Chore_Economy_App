import HttpException from "./exceptions";

export class NotFoundError extends HttpException {
    constructor(message: string = 'Resource not found') {
        super(404, message);
    }
}

export class UnauthorizedError extends HttpException {
    constructor(message: string = 'Unauthorized access') {
        super(401, message);
    }
}

export class ForbiddenError extends HttpException {
    constructor(message: string = 'Forbidden') {
        super(403, message);
    }
}

export class BadRequestError extends HttpException {
    constructor(message: string = 'Bad Request') {
        super(400, message);
    }
}

export class UnprocessableEntityError extends HttpException {
    constructor(message: string = 'Unprocessible Entity') {
        super(422, message);
    }
}