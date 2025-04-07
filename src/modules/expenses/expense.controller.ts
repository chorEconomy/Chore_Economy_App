import { NextFunction, Request, Response } from "express";
import ExpenseService from "./expense.service.js";
import { Admin, Kid, Parent } from "../users/user.model.js";
import { status_codes } from "../../utils/status_constants.js";
import { EChoreStatus, ExpenseStatus } from "../../models/enums.js";
import asyncHandler from "express-async-handler";
import {
  BadRequestError,
  ForbiddenError,
  UnauthorizedError,
  UnprocessableEntityError,
} from "../../models/errors.js";
import sendNotification from "../../utils/notifications.js";
import { Notification } from "../notifications/notification.model.js";

class ExpenseController {
  static createExpense = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const parent = await Parent.findById(req.user);

      if (!parent) {
        throw new UnauthorizedError("Unauthorized access");
      }

      if (!parent.canCreate) {
        const notification = await new Notification({
          recipient: {
            id: parent._id,
            role: "Parent",
          },
          recipientId: parent._id,
          title: "Payment Overdue",
          message: `You cannot create new expenses until you complete your overdue payment.`,
        });

        await notification.save();

        await sendNotification(
          parent.fcmToken,
          notification.title,
          notification.message,
          { notificationId: notification._id }
        );

        throw new ForbiddenError(
          "You cannot create new expenses until you complete your overdue payment."
        );
      }

      if (!req.body) {
        throw new UnprocessableEntityError(
          "Please provide the required fields"
        );
      }

      const expense = await ExpenseService.createExpense(parent, req.body);

      res.status(status_codes.HTTP_200_OK).json({
        status: 200,
        success: true,
        message: `Expense created successfully`,
        data: expense,
      });
      return;
    }
  );

  static fetchExpensesByStatus = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const user =
        (await Parent.findById(req.user)) || (await Kid.findById(req.user));

      if (!user) {
        throw new UnauthorizedError("Unauthorized access");
      }

      const status: any = req.query.status;

      const { page = "1", limit = "10" } = req.query;

      if (!status || !Object.values(ExpenseStatus).includes(status)) {
        throw new BadRequestError(
          "Invalid or missing expense status. Please provide a valid status."
        );
      }

      const parsedPage = Number(page);
      const parsedLimit = Number(limit);

      let expenses: any;

      expenses = await ExpenseService.fetchExpensesByStatusFromDB(
        user,
        status as string,
        parsedPage,
        parsedLimit
      );

      if (status === ExpenseStatus.All) {
        expenses = await ExpenseService.fetchAllExpensesFromDB(
          user,
          parsedPage,
          parsedLimit
        );
      }

      res.status(status_codes.HTTP_200_OK).json({
        status: 200,
        success: true,
        message: `${status} expenses fetched successfully`,
        data: expenses,
      });
      return;
    }
  );

  static PayExpense = asyncHandler(async (req: Request, res: Response) => {
    const kid = await Kid.findById(req.user);

    if (!kid) {
      throw new UnauthorizedError("Unauthorized access");
    }

    const { expenseId } = req.body;

    if (!expenseId) {
      throw new BadRequestError("Expense ID is required");
    }

    const result = await ExpenseService.payExpense(kid, expenseId);

    res.status(status_codes.HTTP_200_OK).json({
      success: true,
      status: 200,
      data: result,
    });
    return;
  });

  static fetchExpensesByParentId = asyncHandler(
    async (req: Request, res: Response) => {
      const admin = Admin.findById(req.user);

      if (!admin) {
        throw new UnauthorizedError("Unauthorized access");
      }

      const parentId = req.params.parentId;

      if (!parentId) {
        throw new BadRequestError("Please provide a valid parent id");
      }

      const expenses = await ExpenseService.fetchExpenseDetailsForParents(
        parentId
      );

      res.status(status_codes.HTTP_200_OK).json({
        status: 200,
        success: true,
        data: expenses,
      });
      return;
    }
  );
}

export default ExpenseController;
