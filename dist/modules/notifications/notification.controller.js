import asyncHandler from "express-async-handler";
import NotificationService from "./notification.service";
import { status_codes } from "../../utils/status_constants";
import { BadRequestError, UnauthorizedError } from "../../models/errors";
import { findUserAndRoleById } from "../../utils/check_user_exists.utils";
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
    static MarkNotificationAsRead = asyncHandler(async (req, res) => {
        const { id } = req.params;
        if (!id) {
            throw new BadRequestError("Notification Id is required!");
        }
        const notification = await NotificationService.markNotificationAsRead(id);
        res.status(status_codes.HTTP_200_OK).json({
            status: 200,
            success: true,
            data: notification
        });
        return;
    });
}
export default NotificationController;
