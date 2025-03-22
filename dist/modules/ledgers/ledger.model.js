import mongoose from "mongoose";
import { ETransactionName, ETransactionType } from "../../models/enums.js";
const LedgerTransactionSchema = new mongoose.Schema({
    kid: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Kid",
        required: true,
        unique: true,
    },
    wallet: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Wallet",
        required: true,
    },
    transactionType: {
        type: String,
        enum: Object.values(ETransactionType),
        required: true,
    },
    transactionName: {
        type: String,
        enum: Object.values(ETransactionName),
        required: true,
    },
    amount: {
        type: Number,
        required: true,
    },
    description: {
        type: String,
    },
}, { timestamps: true });
export default mongoose.model("LedgerTransaction", LedgerTransactionSchema);
