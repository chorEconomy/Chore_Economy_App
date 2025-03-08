import { NextFunction, Request, Response } from "express";
import ExpenseService from "./expense.service.js";
import {AuthenticatedRequest} from "../../models/AuthenticatedUser.js";
import { Kid, User } from "../users/user.model.js";
import {status_codes} from "../../utils/status_constants.js";
import { EChoreStatus, ExpenseStatus } from "../../models/enums.js";

class ExpenseController {
  static async createExpense(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    await ExpenseService.createExpense(req, res);
  }

  static async fetchAllExpenses(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const user =
        (await User.findById(req.user)) || (await Kid.findById(req.user));
      if (!user) {
         res.status(status_codes.HTTP_401_UNAUTHORIZED).json({
          status: status_codes.HTTP_401_UNAUTHORIZED,
          success: false,
          message: "Unauthorized access",
         });
         return
      }

      const { page = "1", limit = "10" } = req.query;

      const parsedPage = Number(page);
      const parsedLimit = Number(limit);

      const expenses = await ExpenseService.fetchAllExpensesFromDB(
        user,
        parsedPage,
        parsedLimit
      );

       res.status(status_codes.HTTP_200_OK).json({
        status: 200,
        success: true,
        message: `Expenses fetched successfully`,
        data: expenses,
       });
       return
    } catch (error: any) {
       res.status(status_codes.HTTP_500_INTERNAL_SERVER_ERROR).json({
        success: false,
        status: 500,
        message: error.message || "An unexpected error occurred",
       });
       return
    }
  }

  static async fetchExpense(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    await ExpenseService.fetchOneExpense(req, res);
  }

  static async fetchExpensesByStatus(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const user =
        (await User.findById(req.user)) || (await Kid.findById(req.user));
      if (!user) {
         res.status(status_codes.HTTP_401_UNAUTHORIZED).json({
          status: status_codes.HTTP_401_UNAUTHORIZED,
          success: false,
          message: "Unauthorized access",
         });
         return
      }

      const status: any = req.query.status

      const {page = "1", limit = "10" } = req.query;

      if (!status || !Object.values(ExpenseStatus).includes(status)) {
        res.status(status_codes.HTTP_400_BAD_REQUEST).json({
            status: 400,
            success: false,
            message: "Invalid or missing expense status. Please provide a valid status.",
        });
        return;
    }
      const parsedPage = Number(page);
      const parsedLimit = Number(limit);

      let expenses: any
      
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
       return
    } catch (error: any) {
       res.status(status_codes.HTTP_500_INTERNAL_SERVER_ERROR).json({
        success: false,
        status: 500,
        message: error.message || "An unexpected error occurred",
       });
       return
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
