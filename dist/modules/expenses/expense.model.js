import { Schema, model } from "mongoose";
import { ExpenseStatus } from "../../models/enums.js";
import mongoose from "mongoose";
const expenseSchema = new Schema({
    parentId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    kidId: { type: mongoose.Schema.Types.ObjectId, ref: "Kid", default: null },
    name: { type: String, required: [true, 'Name is a required field'], trim: true },
    amount: { type: Number, required: [true, 'amount is a required field'], default: 0 },
    dueDate: { type: Date, default: null },
    status: { type: String, enum: Object.values(ExpenseStatus), required: true, default: ExpenseStatus.Unpaid },
    description: { type: String, default: null, trim: true },
}, { timestamps: true });
export const Expense = model("Expense", expenseSchema);
