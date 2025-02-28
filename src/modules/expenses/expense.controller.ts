import { NextFunction, Request, Response } from "express";
import ExpenseService from "./expense.service";
import AuthenticatedRequest from "../../models/AuthenticatedUser";
import { Kid, User } from "../users/user.model";
import status_codes from "../../utils/status_constants";
const asyncHandler = require("express-async-handler");

class ExpenseController {
  static async createExpense(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) {
    return ExpenseService.createExpense(req, res);
  }

  static async fetchAllExpenses(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      const user =
        (await User.findById(req.user)) || (await Kid.findById(req.user));
      if (!user) {
        return res.status(status_codes.HTTP_401_UNAUTHORIZED).json({
          status: status_codes.HTTP_401_UNAUTHORIZED,
          success: false,
          message: "Unauthorized access",
        });
      }

      const { page = "1", limit = "10" } = req.query;

      const parsedPage = Number(page);
      const parsedLimit = Number(limit);

      const expenses = await ExpenseService.fetchAllExpensesFromDB(
        user,
        parsedPage,
        parsedLimit
      );

      return res.status(status_codes.HTTP_200_OK).json({
        status: 200,
        success: true,
        message: `Expenses fetched successfully`,
        data: expenses,
      });
    } catch (error: any) {
      return res.status(status_codes.HTTP_500_INTERNAL_SERVER_ERROR).json({
        success: false,
        status: 500,
        message: error.message || "An unexpected error occurred",
      });
    }
  }

  static async fetchExpense(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) {
    return ExpenseService.fetchOneExpense(req, res);
  }

  static async fetchExpensesByStatus(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      const user =
        (await User.findById(req.user)) || (await Kid.findById(req.user));
      if (!user) {
        return res.status(status_codes.HTTP_401_UNAUTHORIZED).json({
          status: status_codes.HTTP_401_UNAUTHORIZED,
          success: false,
          message: "Unauthorized access",
        });
      }

      const { status, page = "1", limit = "10" } = req.query;

      if (!status) {
        return res.status(status_codes.HTTP_400_BAD_REQUEST).json({
          status: 400,
          success: true,
          message: "Please provide a valid expense status",
        });
      }
      const parsedPage = Number(page);
      const parsedLimit = Number(limit);

      const expenses = await ExpenseService.fetchExpensesByStatusFromDB(
        user,
        status as string,
        parsedPage,
        parsedLimit
      );

      return res.status(status_codes.HTTP_200_OK).json({
        status: 200,
        success: true,
        message: `${status} expenses fetched successfully`,
        data: expenses,
      });
    } catch (error: any) {
      return res.status(status_codes.HTTP_500_INTERNAL_SERVER_ERROR).json({
        success: false,
        status: 500,
        message: error.message || "An unexpected error occurred",
      });
    }
  }

  //   static async fetchPaidExpenses(
  //     req: AuthenticatedRequest,
  //     res: Response,
  //     next: NextFunction
  //   ) {
  //     return ExpenseService.fetchPaidExpenses(req, res);
  //   }
  //   static async fetchPaidExpensesForKid(
  //     req: AuthenticatedRequest,
  //     res: Response,
  //     next: NextFunction
  //   ) {
  //     return ExpenseService.fetchPaidExpensesForKid(req, res);
  //   }
  //   static async fetchUnpaidExpenses(
  //     req: AuthenticatedRequest,
  //     res: Response,
  //     next: NextFunction
  //   ) {
  //     return ExpenseService.fetchUnpaidExpenses(req, res);
  //   }
  //   static async fetchUnpaidExpensesForKid(
  //     req: AuthenticatedRequest,
  //     res: Response,
  //     next: NextFunction
  //   ) {
  //     return ExpenseService.fetchUnpaidExpensesForKid(req, res);
  //   }
}

export default ExpenseController;
