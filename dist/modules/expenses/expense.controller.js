import ExpenseService from "./expense.service.js";
import { Kid, Parent } from "../users/user.model.js";
import { status_codes } from "../../utils/status_constants.js";
import { ExpenseStatus } from "../../models/enums.js";
import asyncHandler from "express-async-handler";
import { BadRequestError, ForbiddenError, UnauthorizedError, UnprocessableEntityError, } from "../../models/errors.js";
import sendNotification from "../../utils/notifications.js";
class ExpenseController {
    static createExpense = asyncHandler(async (req, res, next) => {
        const parent = await Parent.findById(req.user);
        if (!parent) {
            throw new UnauthorizedError("Unauthorized access");
        }
        if (!parent.canCreate) {
            await sendNotification(parent.fcmToken, "Payment Overdue", `You cannot create new expenses until you complete your overdue payment.`);
            throw new ForbiddenError("You cannot create new expenses until you complete your overdue payment.");
        }
        if (!req.body) {
            throw new UnprocessableEntityError("Please provide the required fields");
        }
        const expense = await ExpenseService.createExpense(parent, req.body);
        res.status(status_codes.HTTP_200_OK).json({
            status: 200,
            success: true,
            message: `Expense created successfully`,
            data: expense,
        });
        return;
    });
    static fetchExpensesByStatus = asyncHandler(async (req, res, next) => {
        const user = (await Parent.findById(req.user)) || (await Kid.findById(req.user));
        if (!user) {
            throw new UnauthorizedError("Unauthorized access");
        }
        const status = req.query.status;
        const { page = "1", limit = "10" } = req.query;
        if (!status || !Object.values(ExpenseStatus).includes(status)) {
            throw new BadRequestError("Invalid or missing expense status. Please provide a valid status.");
        }
        const parsedPage = Number(page);
        const parsedLimit = Number(limit);
        let expenses;
        expenses = await ExpenseService.fetchExpensesByStatusFromDB(user, status, parsedPage, parsedLimit);
        if (status === ExpenseStatus.All) {
            expenses = await ExpenseService.fetchAllExpensesFromDB(user, parsedPage, parsedLimit);
        }
        res.status(status_codes.HTTP_200_OK).json({
            status: 200,
            success: true,
            message: `${status} expenses fetched successfully`,
            data: expenses,
        });
        return;
    });
    static PayExpense = asyncHandler(async (req, res) => {
        const kid = await Kid.findById(req.user);
        if (!kid) {
            throw new UnauthorizedError("Unauthorized access");
        }
        const { expenseId } = req.body;
        if (!expenseId) {
            throw new BadRequestError("Expense ID is required");
        }
        const result = await ExpenseService.payExpense(kid, expenseId);
        res.status(status_codes.HTTP_200_OK).json({
            success: true,
            status: 200,
            data: result
        });
        return;
    });
}
export default ExpenseController;
