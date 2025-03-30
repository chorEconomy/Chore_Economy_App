import mongoose, { Schema } from "mongoose";
import { EPaymentSchedule } from "../../models/enums.js";
const paymentScheduleSchema = new Schema({
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
    nextPaymentDate: {
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
