import { NextFunction, Request, Response } from "express";
import asyncHandler from "express-async-handler";
import  NotificationService  from "./notification.service";
import { status_codes } from "../../utils/status_constants";
import { BadRequestError, UnauthorizedError } from "../../models/errors";
import { findUserAndRoleById } from "../../utils/check_user_exists.utils";
 class NotificationController {
    static FecthNotifications = asyncHandler(async (req: Request, res: Response) => { 
        
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
    })

    static FetchNotificationCount = asyncHandler(async (req: Request, res: Response) => {
         
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
     
     static MarkNotificationsAsRead = asyncHandler(async (req: Request, res: Response) => { 
       
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
     })
}

export default NotificationController