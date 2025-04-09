import asyncHandler from "express-async-handler";
import NotificationService from "./notification.service.js";
import { status_codes } from "../../utils/status_constants.js";
import { UnauthorizedError } from "../../models/errors.js";
import { findUserAndRoleById } from "../../utils/check_user_exists.utils.js";
class NotificationController {
    static FecthNotifications = asyncHandler(async (req, res) => {
        const { role, user } = await findUserAndRoleById(req.user);
        if (!user) {
            throw new UnauthorizedError("Unauthorized access!");
        }
        const notifications = await NotificationService.fetchNotifications(user._id);
        res.status(status_codes.HTTP_200_OK).json({
            status: 200,
            success: true,
            data: notifications
        });
        return;
    });
    static FetchNotificationCount = asyncHandler(async (req, res) => {
        const { role, user } = await findUserAndRoleById(req.user);
        if (!user) {
            throw new UnauthorizedError("Unauthorized access");
        }
        const notificationCount = await NotificationService.fetchNotificationCount(user._id);
        res.status(status_codes.HTTP_200_OK).json({
            status: 200,
            success: true,
            data: notificationCount
        });
        return;
    });
    static MarkNotificationsAsRead = asyncHandler(async (req, res) => {
        const { role, user } = await findUserAndRoleById(req.user);
        if (!user) {
            throw new UnauthorizedError("Unauthorized access");
        }
        const notification = await NotificationService.markNotificationsAsRead(user._id);
        res.status(status_codes.HTTP_200_OK).json({
            status: 200,
            success: true,
            data: notification
        });
        return;
    });
}
export default NotificationController;
