import express from "express"
import NotificationController from "./notification.controller";
const notificationRouter = express.Router();


notificationRouter.get("/:userId", NotificationController.FecthNotifications)
notificationRouter.get("/:userId/count", NotificationController.FetchNotificationCount)

export default notificationRouter