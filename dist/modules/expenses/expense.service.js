import { Expense } from "./expense.model.js";
import { ERole, ETransactionName, ExpenseStatus } from "../../models/enums.js";
import paginate from "../../utils/paginate.js";
import WalletService from "../wallets/wallet.service.js";
import { ForbiddenError, NotFoundError } from "../../models/errors.js";
import { Wallet } from "../wallets/wallet.model.js";
class ExpenseService {
    static async createExpense(parent, body) {
        const { name, amount, dueDate, description } = body;
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
    static async fetchAllExpensesFromDB(user, page, limit) {
        const filter = {};
        if (user.role === ERole.Parent) {
            filter.parentId = user._id;
        }
        else if (user.role === ERole.Kid) {
            filter.parentId = user.parentId;
        }
        else {
            throw new Error("Invalid Role");
        }
        return await paginate(Expense, page, limit, "", filter);
    }
    static async fetchExpensesByStatusFromDB(user, status, page, limit) {
        const filter = { status: status };
        if (user.role === ERole.Parent) {
            filter.parentId = user._id;
        }
        else if (user.role === ERole.Kid) {
            filter.parentId = user.parentId;
        }
        else {
            throw new Error("Invalid Role");
        }
        return await paginate(Expense, page, limit, "", filter);
    }
    static async payExpense(kid, expenseId) {
        const expense = await Expense.findOne({ _id: expenseId });
        if (!expense) {
            throw new Error("Expense not found");
        }
        if (expense.status === ExpenseStatus.Paid) {
            throw new ForbiddenError("You've already paid for this expense");
        }
        const wallet = await Wallet.findOne({ kid: kid._id });
        if (!wallet) {
            throw new NotFoundError("Wallet not found");
        }
        await WalletService.deductFundsFromWallet(kid, expense.amount, "Expense Payment", ETransactionName.ExpensePayment, false);
        expense.status = ExpenseStatus.Paid;
        expense.kidId = kid._id;
        await expense.save();
        return { wallet, expense };
    }
    static async fetchExpenseDetailsForParents(parentId) {
        const expenses = await Expense.find({ parentId: parentId }).select("name kidId createdAt dueDate amount status").populate("kidId").select("name").lean();
        return expenses;
    }
}
export default ExpenseService;
