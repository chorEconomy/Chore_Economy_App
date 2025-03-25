import { ESavingSchedule } from "../../models/enums.js";
import mongoose, { Schema, model, ObjectId, Document } from "mongoose"; 

export interface IPayment {
    amount: number;
    date: Date;
    isScheduledPayment: boolean;
  }

 export interface ISavingsGoal {
    savingId: mongoose.Types.ObjectId;
    amountSaved: number;
}
interface ISaving extends Document {
    kidId: ObjectId
    title: string
    startDate: Date
    endDate: Date
    totalSavingAmount: number
    schedule: ESavingSchedule
    amountFrequency: number
    payments: IPayment[]
    isCompleted: boolean
}
interface ISavingsWallet extends Document {
    kid: mongoose.Types.ObjectId;
    balance: number;
    savingsGoals: ISavingsGoal
}

const savingSchema: Schema = new Schema<ISaving>({
    kidId: { type: mongoose.Schema.Types.ObjectId, ref: "Kid", required: true },
    title: { type: String, required: true, trim: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    totalSavingAmount: { type: Number, required: true },
    schedule: { type: String, enum: Object.values(ESavingSchedule), required: true },
    amountFrequency: { type: Number, required: true },
    payments: [{
        amount: { type: Number, required: true },
        date: { type: Date, default: Date.now },
        isScheduledPayment: { type: Boolean, default: false }
    }],
    isCompleted: { type: Boolean, default: false }
}, { timestamps: true });


const savingsWalletSchema = new Schema<ISavingsWallet>({
    kid: { type: mongoose.Schema.Types.ObjectId, ref: "Kid", required: true, unique: true },
    balance: { type: Number, default: 0 },
    savingsGoals: [{
      savingId: { type: mongoose.Schema.Types.ObjectId, ref: "Saving" },
      amountSaved: { type: Number, default: 0 }
    }]
  }, { timestamps: true });
  
  export const Saving = mongoose.models.Saving || model<ISaving>("Saving", savingSchema);
  export const SavingsWallet = mongoose.models.SavingsWallet || model<ISavingsWallet>("SavingsWallet", savingsWalletSchema);