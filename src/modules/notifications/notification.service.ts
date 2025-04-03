import { ERole } from "../../models/enums";
import { Notification } from "./notification.model";

class NotificationService {
    static async fetchNotifications(userId: any, role: string) {
        if (role?.toLowerCase() == ERole.Parent.toLowerCase()) { 
            return await Notification.find({ parentId: userId }).sort({ createdAt: -1 });
        }
        else if (role?.toLowerCase() == ERole.Kid.toLowerCase()) { 
            return await Notification.find({ kidId: userId }).sort({ createdAt: -1 });
        }
    }

    static async fetchNotificationCount(userId: any, role: string) {
        if (role?.toLowerCase() == ERole.Parent.toLowerCase()) { 
            return await Notification.countDocuments({ parentId: userId });
        }
        else if (role?.toLowerCase() == ERole.Kid.toLowerCase()) { 
            return await Notification.countDocuments({ kidId: userId });
        }
    }
}

export default NotificationService