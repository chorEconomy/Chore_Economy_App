import express from "express"
const expenseRouter = express.Router();
import ExpenseController from "./expense.controller.js";
import authorizeParent from "../../middlewares/authentication/parentRoleWare.js";
import authorizeKid from "../../middlewares/authentication/childRoleWare.js";
import authenticateUser from "../../middlewares/authentication/authware.js";


expenseRouter.post("", authorizeParent, ExpenseController.createExpense)
expenseRouter.get("/:id", authorizeParent, ExpenseController.fetchExpense)
expenseRouter.get("", authenticateUser, ExpenseController.fetchExpensesByStatus)

// expenseRouter.get("/paid", authorizeParent, ExpenseController.fetchPaidExpenses)
// expenseRouter.get("/kid/paid", authorizeKid, ExpenseController.fetchPaidExpensesForKid)
// expenseRouter.get("/unpaid", authorizeParent, ExpenseController.fetchUnpaidExpenses)
// expenseRouter.get("/kid/unpaid", authorizeKid, ExpenseController.fetchUnpaidExpensesForKid)

export default expenseRouter