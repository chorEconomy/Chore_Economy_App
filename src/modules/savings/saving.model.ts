import { ESavingSchedule } from "../../models/enums.js";
import mongoose, { Schema, model, ObjectId, Document } from "mongoose"; 

interface ISaving extends Document{
    kidId: ObjectId
    title: string
    startDate: Date
    endDate: Date
    totalSavingAmount: number
    schedule: ESavingSchedule
    amountFrequency: number
}

interface ISavingsWallet extends Document {
    savingId: mongoose.Types.ObjectId;
    kidId: mongoose.Types.ObjectId;
    currentAmount: number;
    payments: Array<{
        amount: number;
        paymentDate: Date;
        isScheduledPayment: boolean;
    }>;
    isCompleted: boolean;
}


const savingSchema: Schema = new Schema<ISaving>({
    kidId: { type: mongoose.Schema.Types.ObjectId, ref: "Kid", default: null },
    endDate: { type: Date, required: [true, 'End Date is a required field'], default: null },
    title: { type: String, required: [true, 'Title is a required field'], trim: true },
    startDate: { type: Date, required: [true, 'Start Date is a required field'], default: null },
    totalSavingAmount: { type: Number, required: [true, 'Total Saving Amount is a required field'], default: 0 },
    schedule: { type: String, enum: Object.values(ESavingSchedule), required: [true, 'Schedule is a required field'] },
    amountFrequency: {type: Number, required: [true, 'Amount Frequency is a required field'] }
}, { timestamps: true })


const savingsWalletSchema = new Schema<ISavingsWallet>({
    savingId: { type: mongoose.Schema.Types.ObjectId, ref: "Saving", required: true },
    kidId: { type: mongoose.Schema.Types.ObjectId, ref: "Kid", required: true },
    currentAmount: { type: Number, default: 0 },
    payments: [{
        amount: Number,
        paymentDate: { type: Date, default: Date.now },
        isScheduledPayment: Boolean
    }],
    isCompleted: { type: Boolean, default: false }
}, { timestamps: true });

export const Saving = model<ISaving>("Saving", savingSchema)
export const SavingsWallet = model<ISavingsWallet>("SavingsWallet", savingsWalletSchema);