import mongoose from "mongoose";
const WalletSchema = new mongoose.Schema(
  {
    kid: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Kid",
      required: true,
      unique: true,
    },
    balance: {
      type: Number,
      default: 0,
    },
    totalEarnings: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);
const SavingsWalletSchema = new mongoose.Schema(
  {
    kid: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Kid",
      required: true,
      unique: true,
    },
    balance: {
      type: Number,
      default: 0,
    },
    totalEarnings: {
      type: Number,
      default: 0,
    },       
    savingsGoals: [
      {
        savingId: { type: mongoose.Schema.Types.ObjectId, ref: "Saving" },
        amountSaved: { type: Number, default: 0 },
      },
    ],
  },
  { timestamps: true }
);
export const Wallet = mongoose.model("Wallet", WalletSchema);
export const SavingsWallet = mongoose.model(
  "SavingsWallet",
  SavingsWalletSchema
);
