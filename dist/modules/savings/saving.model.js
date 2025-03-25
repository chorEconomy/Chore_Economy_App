import { ESavingSchedule } from "../../models/enums.js";
import mongoose, { Schema, model } from "mongoose";
const savingSchema = new Schema({
    kidId: { type: mongoose.Schema.Types.ObjectId, ref: "Kid", default: null },
    endDate: { type: Date, required: [true, 'End Date is a required field'], default: null },
    title: { type: String, required: [true, 'Title is a required field'], trim: true },
    startDate: { type: Date, required: [true, 'Start Date is a required field'], default: null },
    totalSavingAmount: { type: Number, required: [true, 'Total Saving Amount is a required field'], default: 0 },
    schedule: { type: String, enum: Object.values(ESavingSchedule), required: [true, 'Schedule is a required field'] },
    amountFrequency: { type: Number, required: [true, 'Amount Frequency is a required field'] }
}, { timestamps: true });

export const Saving = model("Saving", savingSchema);
// export const SavingsWallet = model("SavingsWallet", savingsWalletSchema);
