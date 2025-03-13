import { Expense } from "./expense.model.js";
import { ERole } from "../../models/enums.js";
import paginate from "../../utils/paginate.js";
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
}
export default ExpenseService;
