import { NotFoundError } from "../../models/errors";
import { Notification } from "./notification.model";
class NotificationService {
    static async fetchNotifications(userId) {
        try {
            const notifications = await Notification.find({ recipientId: userId })
                .sort({ createdAt: -1 });
            return notifications;
        }
        catch (error) {
            throw new Error("Error fetching notifications: " + error.message);
        }
    }
    static async fetchNotificationCount(userId) {
        try {
            const total = await Notification.countDocuments({ recipientId: userId });
            const unread = await Notification.countDocuments({ recipientId: userId, read: false });
            const read = await Notification.countDocuments({ recipientId: userId, read: true });
            return {
                total: total,
                unread: unread,
                read: read
            };
        }
        catch (error) {
            throw new Error("Error fetching notification count: " + error.message);
        }
    }
    static async markNotificationsAsRead(userId) {
        const notifications = await Notification.find({ recipientId: userId, read: false });
        if (!notifications || notifications.length === 0) {
            throw new NotFoundError("No unread notifications found");
        }
        // Get all notification IDs
        const notificationIds = notifications.map(notification => notification._id);
        // Bulk update all notifications
        const result = await Notification.updateMany({ _id: { $in: notificationIds } }, {
            $set: {
                read: true,
                readAt: new Date()
            }
        });
        return result;
    }
}
export default NotificationService;
