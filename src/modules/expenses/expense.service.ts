import { Request, Response } from "express";
import { uploadSingleFile } from "../../utils/file_upload.utils";
import { Expense } from "./expense.model";
import status_codes from "../../utils/status_constants";
import AuthenticatedRequest from "../../models/AuthenticatedUser";
import { Kid, User } from "../users/user.model";
import { ERole, ExpenseStatus } from "../../models/enums";
import { log } from "node:console";
import paginate from "../../utils/paginate";

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
 
  static async fetchOneExpense(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(status_codes.HTTP_401_UNAUTHORIZED).json({
          status: 401,
          success: false,
          message: "Unauthorized access",
        });
      }
      const { id } = req.params
      
      if (!id) {
        return res.status(status_codes.HTTP_400_BAD_REQUEST).json({status: 400, success: false, message: "Provide a valid id"})
      }

      const parentId = req.user;
      console.log(parentId);
      
      const existingParent = await User.findById({ _id: parentId });
      console.log(existingParent);
      
      if (!existingParent) {
        return res.status(status_codes.HTTP_404_NOT_FOUND).json({
          status: 404,
          success: false,
          message: `Parent with the id: ${parentId} not found`,
        });
      }

      const existingExpense = await Expense.findOne({_id: id, parentId: parentId})
      
      if (!existingExpense) {
        return res.status(status_codes.HTTP_404_NOT_FOUND).json({status: 404, success: false, messgae: `Expense not found!`})
      }

      return res
        .status(status_codes.HTTP_200_OK)
        .json({
          status: 200,
          success: true,
          message: "Expense retrieved successfully",
          data: existingExpense
        });

    } catch (error: any) {
      console.error("fetch Expense error:", error);
      return res.status(status_codes.HTTP_500_INTERNAL_SERVER_ERROR).json({
        status: 500,
        success: false,
        message: "Internal server error",
        error: error?.message,
      });
    }
  }

  static async fetchAllExpensesFromDB(user: any, page: number, limit: number) {
    return this.fetchExpensesByStatusFromDB(user, "", page, limit)
  }

  static async fetchExpensesByStatusFromDB(user: any, status: string, page: number, limit: number) {
    const filter: any = { status: status }
    
    if (user.role === ERole.Parent) {
      filter.parentId = user._id
    } else if (user.role === ERole.Kid) {
      filter.kidId = user._id
    } else {
      throw new Error("Invalid Role")
    }
    return await paginate(Expense, page, limit, "", filter)
  }







  // static async fetchAllExpenses(req: AuthenticatedRequest, res: Response) {
  //   try {
  //     if (!req.user) {
  //       return res.status(status_codes.HTTP_401_UNAUTHORIZED).json({
  //         status: 401,
  //         success: false,
  //         message: "Unauthorized access",
  //       });
  //     }

  //     const parentId = req.user;

  //     const existingParent = await User.findById({ _id: parentId });

  //     if (!existingParent) {
  //       return res.status(status_codes.HTTP_404_NOT_FOUND).json({
  //         status: 404,
  //         success: false,
  //         message: `Parent with the id: ${parentId} not found`,
  //       });
  //     }

  //     const page = parseInt(req.query.page as string) || 1
  //     const limit = parseInt(req.query.limit as string) || 10

  //     const paginatedData = await paginate(Expense, page, limit, "", {parentId: parentId})

  //     return res
  //       .status(status_codes.HTTP_200_OK)
  //       .json({
  //         status: 200,
  //         success: true,
  //         message: "Expenses retrieved successfully",
  //         data: paginatedData
  //       });
      
  //   } catch (error: any) {
  //     console.error("Expense retrieval error:", error);
  //     return res.status(status_codes.HTTP_500_INTERNAL_SERVER_ERROR).json({
  //       status: 500,
  //       success: false,
  //       message: "Internal server error",
  //       error: error?.message,
  //     });
  //   }
  // }

  // static async fetchPaidExpenses(req: AuthenticatedRequest, res: Response) {
  //   try {
  //     const parent = await User.findById(req.user)
    
  //     if (!parent) {
  //       return res.status(status_codes.HTTP_401_UNAUTHORIZED).json({
  //         status: 401,
  //         success: false,
  //         message: "Unauthorized access",
  //       });
  //     }

  //     const parentId = parent._id;

  //     const page = parseInt(req.query.page as string) || 1
  //     const limit = parseInt(req.query.limit as string) || 10

  //     const paginatedData = await paginate(Expense, page, limit, "", { status: ExpenseStatus.Paid, parentId: parentId })

  //     return res
  //     .status(status_codes.HTTP_200_OK)
  //     .json({
  //       status: 200,
  //       success: true,
  //       message: "Paid expenses retrieved successfully",
  //       data: paginatedData
  //     });

  //   } catch (error: any) {
  //     console.error("fetchPaidExpenses error:", error);
  //     return res.status(status_codes.HTTP_500_INTERNAL_SERVER_ERROR).json({
  //       status: 500,
  //       success: false,
  //       message: "Internal server error",
  //       error: error?.message,
  //     });
  //   }
  // }
 
  // static async fetchPaidExpensesForKid(req: AuthenticatedRequest, res: Response) {
  //   try {
  //     const kid = await Kid.findById(req.user)
    
  //     if (!kid) {
  //       return res.status(status_codes.HTTP_401_UNAUTHORIZED).json({
  //         status: 401,
  //         success: false,
  //         message: "Unauthorized access",
  //       });
  //     }

  //     const kidId = kid._id;

  //     const page = parseInt(req.query.page as string) || 1
  //     const limit = parseInt(req.query.limit as string) || 10

  //     const paginatedData = await paginate(Expense, page, limit, "", { status: ExpenseStatus.Paid, kidId: kidId })

  //     return res
  //     .status(status_codes.HTTP_200_OK)
  //     .json({
  //       status: 200,
  //       success: true,
  //       message: "Paid expenses for a kid retrieved successfully",
  //       data: paginatedData
  //     });

  //   } catch (error: any) {
  //     console.error("fetchPaidExpenses error:", error);
  //     return res.status(status_codes.HTTP_500_INTERNAL_SERVER_ERROR).json({
  //       status: 500,
  //       success: false,
  //       message: "Internal server error",
  //       error: error?.message,
  //     });
  //   }
  // }
  
  // static async fetchUnpaidExpensesForKid(req: AuthenticatedRequest, res: Response) {
  //   try {
  //     const kid = await Kid.findById(req.user)
    
  //     if (!kid) {
  //       return res.status(status_codes.HTTP_401_UNAUTHORIZED).json({
  //         status: 401,
  //         success: false,
  //         message: "Unauthorized access",
  //       });
  //     }

  //     const kidId = kid._id;

  //     const page = parseInt(req.query.page as string) || 1
  //     const limit = parseInt(req.query.limit as string) || 10

  //     const paginatedData = await paginate(Expense, page, limit, "", { status: ExpenseStatus.Unpaid, kidId: kidId })

  //     return res
  //     .status(status_codes.HTTP_200_OK)
  //     .json({
  //       status: 200,
  //       success: true,
  //       message: "Unpaid expenses for a kid retrieved successfully",
  //       data: paginatedData
  //     });
  //   } catch (error: any) {
  //     console.error("fetchUnPaidExpenses error:", error);
  //     return res.status(status_codes.HTTP_500_INTERNAL_SERVER_ERROR).json({
  //       status: 500,
  //       success: false,
  //       message: "Internal server error",
  //       error: error?.message,
  //     });
  //   }
  // }
  
  // static async fetchUnpaidExpenses(req: AuthenticatedRequest, res: Response) {
  //   try {
  //     const parent = await User.findById(req.user)
    
  //     if (!parent) {
  //       return res.status(status_codes.HTTP_401_UNAUTHORIZED).json({
  //         status: 401,
  //         success: false,
  //         message: "Unauthorized access",
  //       });
  //     }

  //     const parentId = parent._id;

  //     const page = parseInt(req.query.page as string) || 1
  //     const limit = parseInt(req.query.limit as string) || 10

  //     const paginatedData = await paginate(Expense, page, limit, "", { status: ExpenseStatus.Unpaid, parentId: parentId })

  //     return res
  //     .status(status_codes.HTTP_200_OK)
  //     .json({
  //       status: 200,
  //       success: true,
  //       message: "Unpaid expenses retrieved successfully",
  //       data: paginatedData
  //     });
  //   } catch (error: any) {
  //     console.error("fetchPaidExpenses error:", error);
  //     return res.status(status_codes.HTTP_500_INTERNAL_SERVER_ERROR).json({
  //       status: 500,
  //       success: false,
  //       message: "Internal server error",
  //       error: error?.message,
  //     });
  //   }
  // }
}

export default ExpenseService;
