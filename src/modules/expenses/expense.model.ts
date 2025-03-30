import { Schema, model, ObjectId, Document } from "mongoose"; 
import { ExpenseStatus } from "../../models/enums.js";
import mongoose from "mongoose";

interface IExpense extends Document {
    parentId: ObjectId
    kidId: ObjectId
    name: string
    amount: number
    dueDate: Date
    description: string
    status: ExpenseStatus
}

const expenseSchema: Schema = new Schema<IExpense>({
    parentId: { type: mongoose.Schema.Types.ObjectId, ref: "Parent", required: true },
    kidId: { type: mongoose.Schema.Types.ObjectId, ref: "Kid", default: null },
    name: { type: String, required: [true, 'Name is a required field'], trim: true},
    amount: { type: Number, required: [true, 'amount is a required field'], default: 0},
    dueDate: { type: Date, default: null },
    status: { type: String, enum: Object.values(ExpenseStatus), required: true, default: ExpenseStatus.Unpaid},
    description: { type: String, default: null, trim: true},
},
    { timestamps: true }
)

export const Expense = model<IExpense>("Expense", expenseSchema)