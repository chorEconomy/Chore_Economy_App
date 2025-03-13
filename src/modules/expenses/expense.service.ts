import { Request, Response } from "express";
import { uploadSingleFile } from "../../utils/file_upload.utils.js";
import { Expense } from "./expense.model.js";
import {status_codes} from "../../utils/status_constants.js";
import { Kid, User } from "../users/user.model.js";
import { ERole } from "../../models/enums.js";
import paginate from "../../utils/paginate.js";

class ExpenseService {
  static async createExpense(parent: any, body: any) {  
      
    const {name, amount, dueDate, description} = body
    
      const newExpense = await new Expense({
        parentId: parent._id,
        name,
        amount,
        dueDate,
        description,
      });

    await newExpense.save();
    
    return newExpense;
  }
  
  static async fetchAllExpensesFromDB(user: any, page: number, limit: number) {
    const filter: any = {}

    if (user.role === ERole.Parent) {
      filter.parentId = user._id
    } else if (user.role === ERole.Kid) {
      filter.parentId = user.parentId
    } else {
      throw new Error("Invalid Role")
    }
    return await paginate(Expense, page, limit, "", filter)
  }

  static async fetchExpensesByStatusFromDB(user: any, status: string, page: number, limit: number) {
    const filter: any = { status: status }
    
    if (user.role === ERole.Parent) {
      filter.parentId = user._id
    } else if (user.role === ERole.Kid) {
      filter.parentId = user.parentId
    } else {
      throw new Error("Invalid Role")
    }
    return await paginate(Expense, page, limit, "", filter)
  }
}

export default ExpenseService;
