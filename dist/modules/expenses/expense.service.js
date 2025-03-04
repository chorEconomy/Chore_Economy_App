import { Expense } from "./expense.model.js";
import { status_codes } from "../../utils/status_constants.js";
import { User } from "../users/user.model.js";
import { ERole } from "../../models/enums.js";
import paginate from "../../utils/paginate.js";
class ExpenseService {
    static async createExpense(req, res) {
        try {
            if (!req.body) {
                return res.status(status_codes.HTTP_422_UNPROCESSABLE_ENTITY).json({
                    status: 422,
                    success: false,
                    message: "Unprocessable request body",
                });
            }
            if (!req.user) {
                return res.status(status_codes.HTTP_401_UNAUTHORIZED).json({
                    status: 401,
                    success: false,
                    message: "Unauthorized access",
                });
            }
            const { name, amount, dueDate, description } = req.body;
            const parentId = req.user;
            const existingParent = await User.findById({ _id: parentId });
            if (!existingParent) {
                return res.status(status_codes.HTTP_404_NOT_FOUND).json({
                    status: 404,
                    success: false,
                    message: `Parent with the id: ${parentId} not found`,
                });
            }
            const newExpense = await new Expense({
                parentId,
                name,
                amount,
                dueDate,
                description,
            });
            await newExpense.save();
            return res.status(status_codes.HTTP_200_OK).json({
                status: 200,
                success: true,
                message: "Expense created successfully",
            });
        }
        catch (error) {
            console.error("Expense creation error:", error);
            return res.status(status_codes.HTTP_500_INTERNAL_SERVER_ERROR).json({
                status: 500,
                success: false,
                message: "Internal server error",
                error: error?.message,
            });
        }
    }
    static async fetchOneExpense(req, res) {
        try {
            if (!req.user) {
                return res.status(status_codes.HTTP_401_UNAUTHORIZED).json({
                    status: 401,
                    success: false,
                    message: "Unauthorized access",
                });
            }
            const { id } = req.params;
            if (!id) {
                return res.status(status_codes.HTTP_400_BAD_REQUEST).json({ status: 400, success: false, message: "Provide a valid id" });
            }
            const parentId = req.user;
            console.log(parentId);
            const existingParent = await User.findById({ _id: parentId });
            console.log(existingParent);
            if (!existingParent) {
                return res.status(status_codes.HTTP_404_NOT_FOUND).json({
                    status: 404,
                    success: false,
                    message: `Parent with the id: ${parentId} not found`,
                });
            }
            const existingExpense = await Expense.findOne({ _id: id, parentId: parentId });
            if (!existingExpense) {
                return res.status(status_codes.HTTP_404_NOT_FOUND).json({ status: 404, success: false, messgae: `Expense not found!` });
            }
            return res
                .status(status_codes.HTTP_200_OK)
                .json({
                status: 200,
                success: true,
                message: "Expense retrieved successfully",
                data: existingExpense
            });
        }
        catch (error) {
            console.error("fetch Expense error:", error);
            return res.status(status_codes.HTTP_500_INTERNAL_SERVER_ERROR).json({
                status: 500,
                success: false,
                message: "Internal server error",
                error: error?.message,
            });
        }
    }
    static async fetchAllExpensesFromDB(user, page, limit) {
        return this.fetchExpensesByStatusFromDB(user, "", page, limit);
    }
    static async fetchExpensesByStatusFromDB(user, status, page, limit) {
        const filter = { status: status };
        if (user.role === ERole.Parent) {
            filter.parentId = user._id;
        }
        else if (user.role === ERole.Kid) {
            filter.kidId = user._id;
        }
        else {
            throw new Error("Invalid Role");
        }
        return await paginate(Expense, page, limit, "", filter);
    }
}
export default ExpenseService;
