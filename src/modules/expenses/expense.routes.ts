import express from "express"
const expenseRouter = express.Router();
import ExpenseController from "./expense.controller.js";
import authorizeParent from "../../middlewares/authentication/parentRoleWare.js";
import authenticateUser from "../../middlewares/authentication/authware.js";
import authorizeKid from "../../middlewares/authentication/childRoleWare.js";
import authorizeAdmin from "../../middlewares/authentication/adminRoleWare.js";


expenseRouter.post("", authorizeParent, ExpenseController.createExpense)
expenseRouter.get("", authenticateUser, ExpenseController.fetchExpensesByStatus)
expenseRouter.post("/pay", authorizeKid, ExpenseController.PayExpense)
expenseRouter.get("/:parentId", authorizeAdmin, ExpenseController.fetchExpensesByParentId)

export default expenseRouter