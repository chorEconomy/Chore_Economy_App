import express from "express"
import NotificationController from "./notification.controller";
import authenticateUser from "../../middlewares/authentication/authware";
const notificationRouter = express.Router();


notificationRouter.get("", authenticateUser, NotificationController.FecthNotifications)
notificationRouter.get("/count", authenticateUser, NotificationController.FetchNotificationCount)
notificationRouter.patch("/:id/read", NotificationController.MarkNotificationAsRead)

export default notificationRouter