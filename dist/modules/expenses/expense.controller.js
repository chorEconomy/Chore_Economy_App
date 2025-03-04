import ExpenseService from "./expense.service.js";
import { Kid, User } from "../users/user.model.js";
import { status_codes } from "../../utils/status_constants.js";
class ExpenseController {
    static async createExpense(req, res, next) {
        await ExpenseService.createExpense(req, res);
    }
    static async fetchAllExpenses(req, res, next) {
        try {
            const user = (await User.findById(req.user)) || (await Kid.findById(req.user));
            if (!user) {
                res.status(status_codes.HTTP_401_UNAUTHORIZED).json({
                    status: status_codes.HTTP_401_UNAUTHORIZED,
                    success: false,
                    message: "Unauthorized access",
                });
                return;
            }
            const { page = "1", limit = "10" } = req.query;
            const parsedPage = Number(page);
            const parsedLimit = Number(limit);
            const expenses = await ExpenseService.fetchAllExpensesFromDB(user, parsedPage, parsedLimit);
            res.status(status_codes.HTTP_200_OK).json({
                status: 200,
                success: true,
                message: `Expenses fetched successfully`,
                data: expenses,
            });
            return;
        }
        catch (error) {
            res.status(status_codes.HTTP_500_INTERNAL_SERVER_ERROR).json({
                success: false,
                status: 500,
                message: error.message || "An unexpected error occurred",
            });
            return;
        }
    }
    static async fetchExpense(req, res, next) {
        await ExpenseService.fetchOneExpense(req, res);
    }
    static async fetchExpensesByStatus(req, res, next) {
        try {
            const user = (await User.findById(req.user)) || (await Kid.findById(req.user));
            if (!user) {
                res.status(status_codes.HTTP_401_UNAUTHORIZED).json({
                    status: status_codes.HTTP_401_UNAUTHORIZED,
                    success: false,
                    message: "Unauthorized access",
                });
                return;
            }
            const { status, page = "1", limit = "10" } = req.query;
            if (!status) {
                res.status(status_codes.HTTP_400_BAD_REQUEST).json({
                    status: 400,
                    success: true,
                    message: "Please provide a valid expense status",
                });
                return;
            }
            const parsedPage = Number(page);
            const parsedLimit = Number(limit);
            const expenses = await ExpenseService.fetchExpensesByStatusFromDB(user, status, parsedPage, parsedLimit);
            res.status(status_codes.HTTP_200_OK).json({
                status: 200,
                success: true,
                message: `${status} expenses fetched successfully`,
                data: expenses,
            });
            return;
        }
        catch (error) {
            res.status(status_codes.HTTP_500_INTERNAL_SERVER_ERROR).json({
                success: false,
                status: 500,
                message: error.message || "An unexpected error occurred",
            });
            return;
        }
    }
}
export default ExpenseController;
