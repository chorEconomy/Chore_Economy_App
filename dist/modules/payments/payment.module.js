import mongoose, { Schema, model } from "mongoose";
const kidAccountSchema = new Schema({
    kidId: { type: mongoose.Schema.Types.ObjectId, ref: "Kid", required: true },
    accountBalance: { type: Number, required: [true, 'Earn is a required field'], default: 0 },
    earnings: { type: Number, required: [true, 'Earn is a required field'], default: 0 },
}, { timestamps: true });
export const KidAccount = model("KidAccount", kidAccountSchema);
