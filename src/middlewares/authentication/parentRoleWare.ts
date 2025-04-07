import jwt from 'jsonwebtoken';

import { NextFunction, Request, Response } from "express";
import {status_codes} from "../../utils/status_constants.js";
import { ERole } from "../../models/enums.js";
import { check_if_user_exists } from "../../utils/check_user_exists.utils.js"; 

const authorizeParent = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const secret = process.env.ACCESS_SECRET;

    // Ensure the secret exists
    if (!secret) {
        res.status(status_codes.HTTP_500_INTERNAL_SERVER_ERROR).json({
            status: 500,
            message: "Server configuration error: ACCESS_SECRET is missing",
        });
        return; // Make sure to return after sending the response to prevent further code execution
    }

    const authHeader = req.headers.authorization;

    // Ensure authorization header exists and starts with "Bearer"
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        res.status(status_codes.HTTP_401_UNAUTHORIZED).json({
            status: 401,
            message: "No token provided",
        });
        return; // Return to prevent further execution
    }

    const token = authHeader.split(" ")[1];

    try {
        // Verify the token
        const payload = jwt.verify(token, secret) as { sub: string };

        // Check if the user exists
        const foundParent = await check_if_user_exists(payload.sub);

        if (!foundParent) {
            res.status(status_codes.HTTP_404_NOT_FOUND).json({
                status: 404,
                message: "Parent not found or token is invalid",
            });
            return; // Return to prevent further execution
        }

        // Ensure the user has the "Parent" role
        if (foundParent.role !== ERole.Parent) {
            res.status(status_codes.HTTP_403_FORBIDDEN).json({
                status: 403,
                message: "You are not authorized to access this route",
            });
            return; // Return to prevent further execution
        }

        // Attach user ID to the request and proceed to next middleware
        req.user = payload.sub;
        next(); // Proceed to the next handler

    } catch (err: any) {
        if (err.name === "TokenExpiredError") {
            res.status(status_codes.HTTP_401_UNAUTHORIZED).json({
                status: 401,
                message: "Token has expired",
            });
            return; // Return to prevent further execution
        }

        res.status(status_codes.HTTP_403_FORBIDDEN).json({
            status: 403,
            message: "Invalid token",
        });
        return; // Return to prevent further execution
    }
};

export default authorizeParent;