import express from "express"
import NotificationController from "./notification.controller.js";
import authenticateUser from "../../middlewares/authentication/authware.js";
const notificationRouter = express.Router();


notificationRouter.get("", authenticateUser, NotificationController.FecthNotifications)
notificationRouter.get("/count", authenticateUser, NotificationController.FetchNotificationCount)
notificationRouter.patch("/read", authenticateUser, NotificationController.MarkNotificationsAsRead)

export default notificationRouter