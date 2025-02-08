const express = require("express");
const expenseRouter = express.Router();
import ExpenseController from "./expense.controller";
import authorizeParent from "../../middlewares/authentication/parentRoleWare";
import upload from "../../config/multer.config";


expenseRouter.post("", authorizeParent, ExpenseController.createExpense)
expenseRouter.get("", authorizeParent, ExpenseController.fetchAllExpenses)
expenseRouter.get("/:id", authorizeParent, ExpenseController.fetchExpense)
expenseRouter.get("/paid", authorizeParent, ExpenseController.fetchPaidExpense)
expenseRouter.get("/unpaid", authorizeParent, ExpenseController.fetchUnpaidExpenses)

export default expenseRouter