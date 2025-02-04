 
import { RequestUser } from "../../models/RequestUser";
import status_codes from "../../utils/status_constants";
import { NextFunction, Request, Response } from "express";
const jwt           = require('jsonwebtoken'); 
const {check_if_user_exist_with_id}    = require('../../utils/check_user_exists.utils');



const authenticateUser = async (req: RequestUser, res: Response, next: NextFunction) => {
    try {
        const secret = process.env.ACCESS_SECRET;
        if (!secret) {
            return res.status(status_codes.HTTP_500_INTERNAL_SERVER_ERROR).json({
                status: 500,
                message: "Server configuration error: ACCESS_SECRET is missing",
            });
        }

        const authHeader = req.headers["authorization"];
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(status_codes.HTTP_403_FORBIDDEN).json({
                status: 403,
                message: "You are not authorized, login to access this route",
            });
        }

        const token = authHeader.split(" ")[1];

        if (!token) {
            return res.status(status_codes.HTTP_401_UNAUTHORIZED).json({
                status: 401,
                message: "No token provided",
            });
        }

        jwt.verify(token, secret, async (err: any, payload: any) => {
            if (err) {
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

            const foundUser = await check_if_user_exist_with_id(payload?.sub);
            if (!foundUser) {
                return res.status(status_codes.HTTP_404_NOT_FOUND).json({
                    status: 404,
                    message: "Token not valid or user not found",
                });
            }
            req.user = foundUser;
            next();
        });
    } catch (error) {
        return res.status(status_codes.HTTP_500_INTERNAL_SERVER_ERROR).json({
            status: 500,
            message: "Internal Server Error",
        });
    }
};

export default authenticateUser;