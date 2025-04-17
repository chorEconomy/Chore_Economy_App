import { BadRequestError } from "../models/errors";
export function validateRequiredFields(fields, context) {
    const missing = Object.entries(fields)
        .filter(([_, value]) => value === undefined || value === null || value === '')
        .map(([key]) => key);
    if (missing.length) {
        throw new BadRequestError(`${context ? context + ': ' : ''}Missing required fields: ${missing.join(', ')}`);
    }
}
export function validateUserType(userType) {
    if (!['parent', 'admin'].includes(userType)) {
        throw new BadRequestError("Invalid userType");
    }
}
