import { Schema, model, ObjectId, Document } from "mongoose"; 
import { ExpenseStatus } from "../../models/enums";
const mongoose = require("mongoose")

interface IExpense extends Document {
    parentId: ObjectId
    name: string
    amount: number
    dueDate: Date
    description: string
    status: ExpenseStatus
}

const expenseSchema: Schema = new Schema<IExpense>({
    parentId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: [true, 'Name is a required field'], trim: true},
    amount: { type: Number, required: [true, 'amount is a required field'], default: 0},
    dueDate: { type: Date, default: null },
    status: { type: String, enum: Object.values(ExpenseStatus), required: true, default: ExpenseStatus.Unpaid},
    description: { type: String, default: null, trim: true},
},
    { timestamps: true }
)

export const Expense = model<IExpense>("Expense", expenseSchema)