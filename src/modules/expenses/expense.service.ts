import { Request, Response } from "express";
import { uploadSingleFile } from "../../utils/file_upload.utils";
import { Expense } from "./expense.model";
import status_codes from "../../utils/status_constants";
import AuthenticatedRequest from "../../models/AuthenticatedUser";
import { User } from "../users/user.model";
import { ExpenseStatus } from "../../models/enums";

class ExpenseService {
  static async createExpense(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.body) {
        return res.status(status_codes.HTTP_422_UNPROCESSABLE_ENTITY).json({
          status: 422,
          success: false,
          message: "Unprocessable request body",
        });
      }

      if (!req.user) {
        return res.status(status_codes.HTTP_401_UNAUTHORIZED).json({
          status: 401,
          success: false,
          message: "Unauthorized access",
        });
      }

      const { name, amount, dueDate, description } = req.body;
      const parentId = req.user;

      const existingParent = await User.findById({ _id: parentId });

      if (!existingParent) {
        return res.status(status_codes.HTTP_404_NOT_FOUND).json({
          status: 404,
          success: false,
          message: `Parent with the id: ${parentId} not found`,
        });
      }

      const newExpense = await new Expense({
        parentId,
        name,
        amount,
        dueDate,
        description,
      });

      await newExpense.save();

      return res.status(status_codes.HTTP_200_OK).json({
        status: 200,
        success: true,
        message: "Expense created successfully",
      });
    } catch (error: any) {
      console.error("Expense creation error:", error);
      return res.status(status_codes.HTTP_500_INTERNAL_SERVER_ERROR).json({
        status: 500,
        success: false,
        message: "Internal server error",
        error: error?.message,
      });
    }
  }

  static async fetchAllExpenses(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(status_codes.HTTP_401_UNAUTHORIZED).json({
          status: 401,
          success: false,
          message: "Unauthorized access",
        });
      }

      const parentId = req.user;

      const existingParent = await User.findById({ _id: parentId });

      if (!existingParent) {
        return res.status(status_codes.HTTP_404_NOT_FOUND).json({
          status: 404,
          success: false,
          message: `Parent with the id: ${parentId} not found`,
        });
      }

      const expenses = await Expense.find();

      return res
        .status(status_codes.HTTP_200_OK)
        .json({
          status: 200,
          data: expenses,
          success: true,
          message: "Expenses retrieved successfully",
        });
      
    } catch (error: any) {
      console.error("Expense retrieval error:", error);
      return res.status(status_codes.HTTP_500_INTERNAL_SERVER_ERROR).json({
        status: 500,
        success: false,
        message: "Internal server error",
        error: error?.message,
      });
    }
  }

  static async fetchPaidExpenses(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(status_codes.HTTP_401_UNAUTHORIZED).json({
          status: 401,
          success: false,
          message: "Unauthorized access",
        });
      }

      const parentId = req.user;

      const existingParent = await User.findById({ _id: parentId });

      if (!existingParent) {
        return res.status(status_codes.HTTP_404_NOT_FOUND).json({
          status: 404,
          success: false,
          message: `Parent with the id: ${parentId} not found`,
        });
      }

      const paidExpenses = await Expense.find({ status: ExpenseStatus.Paid });

      return res
      .status(status_codes.HTTP_200_OK)
      .json({
        status: 200,
        success: true,
        data: paidExpenses,
        message: "Paid expenses retrieved successfully",
      });

    } catch (error: any) {
      console.error("fetchPaidExpenses error:", error);
      return res.status(status_codes.HTTP_500_INTERNAL_SERVER_ERROR).json({
        status: 500,
        success: false,
        message: "Internal server error",
        error: error?.message,
      });
    }
  }
  static async fetchUnpaidExpenses(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(status_codes.HTTP_401_UNAUTHORIZED).json({
          status: 401,
          success: false,
          message: "Unauthorized access",
        });
      }

      const parentId = req.user;

      const existingParent = await User.findById({ _id: parentId });

      if (!existingParent) {
        return res.status(status_codes.HTTP_404_NOT_FOUND).json({
          status: 404,
          success: false,
          message: `Parent with the id: ${parentId} not found`,
        });
      }

      const unpaidExpenses = await Expense.find({ status: ExpenseStatus.Unpaid })

      return res
      .status(status_codes.HTTP_200_OK)
      .json({
        status: 200,
        success: true,
        data: unpaidExpenses,
        message: "Unpaid expenses retrieved successfully",
      });
    } catch (error: any) {
      console.error("fetchPaidExpenses error:", error);
      return res.status(status_codes.HTTP_500_INTERNAL_SERVER_ERROR).json({
        status: 500,
        success: false,
        message: "Internal server error",
        error: error?.message,
      });
    }
  }
}

export default ExpenseService;
