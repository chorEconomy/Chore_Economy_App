import mongoose, { Schema } from "mongoose";
import { ETransactionName, ETransactionType } from "../../models/enums.js";

export interface ILedgerTransaction extends mongoose.Document {
  wallet: mongoose.Schema.Types.ObjectId;
  kid: mongoose.Schema.Types.ObjectId;
  transactionType: ETransactionType;
  transactionName: ETransactionName;
  amount: number;
  description?: string;
}

const LedgerTransactionSchema: Schema = new mongoose.Schema<ILedgerTransaction>(
  {
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
  },
  { timestamps: true }
);

export default mongoose.model<ILedgerTransaction>(
  "LedgerTransaction",
  LedgerTransactionSchema
);
