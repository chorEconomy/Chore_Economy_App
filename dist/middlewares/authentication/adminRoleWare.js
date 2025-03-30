import jwt from "jsonwebtoken";
import { status_codes } from "../../utils/status_constants.js";
import { ERole } from "../../models/enums.js";
import { check_if_user_or_kid_exists } from "../../utils/check_user_exists.utils.js";
const authorizeAdmin = async (req, res, next) => {
    const secret = process.env.ACCESS_SECRET;
    if (!secret) {
        res.status(status_codes.HTTP_500_INTERNAL_SERVER_ERROR).json({
            status: 500,
            message: "Server configuration error: ACCESS_SECRET is missing",
        });
        return;
    }
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        res.status(status_codes.HTTP_401_UNAUTHORIZED).json({
            status: 401,
            message: "No token provided",
        });
        return;
    }
    const token = authHeader.split(" ")[1];
    try {
        // Verify the token
        const payload = jwt.verify(token, secret);
        // Check if the user exists
        const foundAdmin = await check_if_user_or_kid_exists(payload.sub);
        if (!foundAdmin) {
            res.status(status_codes.HTTP_404_NOT_FOUND).json({
                status: 404,
                message: "Admin not found or token is invalid",
            });
            return;
        }
        // Check if the user is an admin
        if (foundAdmin.role !== ERole.Admin) {
            res.status(status_codes.HTTP_403_FORBIDDEN).json({
                status: 403,
                message: "You are not authorized to access this route",
            });
            return;
        }
        // Attach user ID to the request and proceed
        req.user = payload.sub;
        console.log(req.user);
        
        next();
    }
    catch (err) {
        if (err.name === "TokenExpiredError") {
            res.status(status_codes.HTTP_401_UNAUTHORIZED).json({
                status: 401,
                message: "Token has expired",
            });
            return;
        }
        res.status(status_codes.HTTP_403_FORBIDDEN).json({
            status: 403,
            message: "Invalid token",
        });
        return;
    }
};
export default authorizeAdmin;
