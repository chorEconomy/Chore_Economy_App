import mongoose, { Schema, model, ObjectId, Document } from "mongoose";
import { EPaymentSchedule } from "../../models/enums.js";

interface IPaymentSchedule extends Document {
  parent: ObjectId;
  scheduleType: string;
  startDate: Date;
  nextDueDate: Date;
  status: string;
}

const paymentScheduleSchema: Schema = new Schema<IPaymentSchedule>({
  parent: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Parent", 
    required: true 
  },
  scheduleType: { 
    type: String, 
    enum: Object.values(EPaymentSchedule),
    required: true 
  },
  startDate: { 
    type: Date, 
    required: true 
  },
  nextDueDate: { 
    type: Date, 
    required: true 
  },
  status: { 
    type: String, 
    enum: ["active", "inactive"], 
    default: "active" 
  },
}, { timestamps: true });

export const PaymentSchedule = mongoose.model("PaymentSchedule", paymentScheduleSchema);