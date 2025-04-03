import { NextFunction, Request, Response } from "express";
import asyncHandler from "express-async-handler";
import  NotificationService  from "./notification.service";
import { status_codes } from "../../utils/status_constants";
import { BadRequestError } from "../../models/errors";
 class NotificationController {
    static FecthNotifications = asyncHandler(async (req: Request, res: Response) => { 
    
        const role = req.query.role?.toString();
        
        if (!role) {
            throw new BadRequestError("Role is required!");
        }

        const { userId } = req.params;

        if (!userId) {
            throw new BadRequestError("User Id is required!");
        }
        
        const notifications = await NotificationService.fetchNotifications(userId, role);

        res.status(status_codes.HTTP_200_OK).json({
            status: 200,
            success: true,
            data: notifications
        });
        return;
    })

    static FetchNotificationCount = asyncHandler(async (req: Request, res: Response) => {
        const role = req.query.role?.toString()

        if (!role) {
            throw new BadRequestError("Role is required!");
        }

        const { userId } = req.params;
        
        if (!userId) {
            throw new BadRequestError("User Id is required!");
        }

        const notificationCount = await NotificationService.fetchNotificationCount(userId, role);

        res.status(status_codes.HTTP_200_OK).json({
            status: 200,
            success: true,
            data: notificationCount
        });
        return;
    });
}

export default NotificationController