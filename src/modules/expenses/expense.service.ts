import { Expense } from "./expense.model.js";
import { ERole, ETransactionName, ExpenseStatus } from "../../models/enums.js";
import paginate from "../../utils/paginate.js";
import WalletService from "../wallets/wallet.service.js";
import { NotFoundError } from "../../models/errors.js";
import { Wallet } from "../wallets/wallet.model.js";

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

  
  static async payExpense(kid: any, expenseId: any) {
    const expense = await Expense.findOne({ kidId: kid._id, _id: expenseId });

    if (!expense) {
      throw new Error("Expense not found");
    }

    const wallet = await Wallet.findOne({ kid: kid._id });

    if (!wallet) {
      throw new NotFoundError("Wallet not found");
    }

    await WalletService.deductFundsFromWallet(kid, expense.amount, "Expense Payment", ETransactionName.ExpensePayment);

    expense.status = ExpenseStatus.Paid;
    await expense.save();

    // Credit the parent's account (if needed)

    return { wallet, expense }
  }
}

export default ExpenseService;
