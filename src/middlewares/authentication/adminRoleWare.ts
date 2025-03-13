import jwt from "jsonwebtoken";
import { NextFunction, Request, Response } from "express";
import {status_codes} from "../../utils/status_constants.js";
import { ERole } from "../../models/enums.js";
import { check_if_user_or_kid_exists } from "../../utils/check_user_exists.utils.js";
import { AuthenticatedRequest } from "../../models/authenticatedUser.js";

const authorizeAdmin = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const secret = process.env.ACCESS_SECRET;
    
    if (!secret) {
        return res.status(status_codes.HTTP_500_INTERNAL_SERVER_ERROR).json({
            status: 500,
            message: "Server configuration error: ACCESS_SECRET is missing",
        });
    }

    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(status_codes.HTTP_401_UNAUTHORIZED).json({
            status: 401,
            message: "No token provided",
        });
    }

    const token = authHeader.split(" ")[1];

    try {
        // Verify the token
        const payload = jwt.verify(token, secret) as { sub: string };

        // Check if the user exists
        const foundUser = await check_if_user_or_kid_exists(payload.sub);
        if (!foundUser) {
            return res.status(status_codes.HTTP_404_NOT_FOUND).json({
                status: 404,
                message: "User not found or token is invalid",
            });
        }

        // Check if the user is an admin
        if (foundUser.role !== ERole.Admin) {
            return res.status(status_codes.HTTP_403_FORBIDDEN).json({
                status: 403,
                message: "You are not authorized to access this route",
            });
        }

        // Attach user ID to the request and proceed
        req.user = payload.sub;
        next();

    } catch (err: any) {
        if (err.name === "TokenExpiredError") {
            return res.status(status_codes.HTTP_401_UNAUTHORIZED).json({
                status: 401,
                message: "Token has expired",
            });
        }
        return res.status(status_codes.HTTP_403_FORBIDDEN).json({
            status: 403,
            message: "Invalid token",
        });
    }
};

export default authorizeAdmin;
