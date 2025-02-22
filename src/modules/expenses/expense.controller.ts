import { NextFunction, Request, Response } from "express";
import ExpenseService from "./expense.service";
import AuthenticatedRequest from "../../models/AuthenticatedUser";


class ExpenseController {
    static async createExpense(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        return ExpenseService.createExpense(req, res)
    }
    
    static async fetchAllExpenses(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        return ExpenseService.fetchAllExpenses(req, res)
    }
  
    static async fetchExpense(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        return ExpenseService.fetchOneExpense(req, res)
    }

    static async fetchPaidExpense(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        return ExpenseService.fetchPaidExpenses(req, res)
    }
    static async fetchUnpaidExpenses(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        return ExpenseService.fetchUnpaidExpenses(req, res)
    }
}

export default ExpenseController