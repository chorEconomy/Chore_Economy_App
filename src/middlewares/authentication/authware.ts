 
import { AuthenticatedRequest } from "../../models/authenticatedUser.js";
import { check_if_user_or_kid_exists } from "../../utils/check_user_exists.utils.js";
import {status_codes} from "../../utils/status_constants.js";
import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken"



const authenticateUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const secret = process.env.ACCESS_SECRET;
        if (!secret) {
         res.status(status_codes.HTTP_500_INTERNAL_SERVER_ERROR).json({
                status: 500,
                message: "Server configuration error: ACCESS_SECRET is missing",
         });
            return;
        }

        const authHeader = req.headers["authorization"];
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
             res.status(status_codes.HTTP_403_FORBIDDEN).json({
                status: 403,
                message: "You are not authorized, login to access this route",
             });
             return
        }

        const token = authHeader.split(" ")[1];

        if (!token) {
             res.status(status_codes.HTTP_401_UNAUTHORIZED).json({
                status: 401,
                message: "No token provided",
             });
             return
        }

        jwt.verify(token, secret, async (err: any, payload: any) => {
            if (err) {
                if (err.name === "TokenExpiredError") {
                     res.status(status_codes.HTTP_401_UNAUTHORIZED).json({
                        status: 401,
                        message: "Token has expired",
                     });
                     return
                }
                 res.status(status_codes.HTTP_403_FORBIDDEN).json({
                    status: 403,
                    message: "Invalid token",
                 });
                 return
            }

            const foundUser = await check_if_user_or_kid_exists(payload?.sub);
            if (!foundUser) {
                 res.status(status_codes.HTTP_404_NOT_FOUND).json({
                    status: 404,
                    message: "Token not valid or user not found",
                 });
                 return
            }
            req.user = foundUser;
            next();
        });
    } catch (error: any) {
         res.status(status_codes.HTTP_500_INTERNAL_SERVER_ERROR).json({
            status: 500,
            message: `${error.message}`,
         });
         return
    }
};

export default authenticateUser;