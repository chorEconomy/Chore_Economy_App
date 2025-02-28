const express = require("express");
const expenseRouter = express.Router();
import ExpenseController from "./expense.controller";
import authorizeParent from "../../middlewares/authentication/parentRoleWare";
import upload from "../../config/multer.config";
import authorizeKid from "../../middlewares/authentication/childRoleWare";
import authenticateUser from "../../middlewares/authentication/authware";


expenseRouter.post("", authorizeParent, ExpenseController.createExpense)
expenseRouter.get("", authenticateUser, ExpenseController.fetchAllExpenses)
expenseRouter.get("/:id", authorizeParent, ExpenseController.fetchExpense)
expenseRouter.get("", authenticateUser, ExpenseController.fetchExpensesByStatus)

// expenseRouter.get("/paid", authorizeParent, ExpenseController.fetchPaidExpenses)
// expenseRouter.get("/kid/paid", authorizeKid, ExpenseController.fetchPaidExpensesForKid)
// expenseRouter.get("/unpaid", authorizeParent, ExpenseController.fetchUnpaidExpenses)
// expenseRouter.get("/kid/unpaid", authorizeKid, ExpenseController.fetchUnpaidExpensesForKid)

export default expenseRouter