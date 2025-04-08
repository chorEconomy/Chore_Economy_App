import { BadRequestError, NotFoundError } from "../../models/errors";
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
    static async markNotificationAsRead(notificationId) {
        const notification = await Notification.findById(notificationId);
        if (!notification) {
            throw new NotFoundError("Notification not found");
        }
        if (notification.read) {
            throw new BadRequestError("Notification already read");
        }
        notification.read = true;
        notification.readAt = new Date();
        await notification.save();
        return notification;
    }
}
export default NotificationService;
