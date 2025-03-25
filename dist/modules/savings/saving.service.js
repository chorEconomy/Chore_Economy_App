import { ETransactionName, ETransactionType } from "../../models/enums.js";
import calculateEndDate from "../../utils/converter.utils.js";
import paginate from "../../utils/paginate.js";
import { Wallet } from "../wallets/wallet.model.js";
import LedgerTransaction from "../ledgers/ledger.model.js";
import { Saving } from "./saving.model.js";
import { ForbiddenError, NotFoundError } from "../../models/errors.js";
class SavingService {
    static async createSaving(data, kidId) {
        const { title, startDate, totalSavingAmount, schedule, amountFrequency } = data;
        const endDate = calculateEndDate(startDate, totalSavingAmount, amountFrequency, schedule);
        const saving = await new Saving({
            kidId,
            title,
            startDate,
            endDate: endDate,
            totalSavingAmount,
            amountFrequency,
            schedule: schedule?.toLowerCase()
        });
        await saving.save();
  
        return saving;
    }
    static calculateProgress(currentAmount, totalAmount) {
        return totalAmount > 0 ? Math.min(100, (currentAmount / totalAmount) * 100) : 0;
    }
    static async fetchSaving(id, kidId) {
        const saving = await Saving.findOne({ kidId: kidId, _id: id });
        return saving;
    }
    static async fetchAllSavings(kidId, page, limit) {
        const savings = await paginate(Saving, page, limit, "", { kidId: kidId });
        return savings;
    }
    static async deleteSaving(id, kidId) {
        const saving = await Saving.findOneAndDelete({ kidId: kidId, _id: id });
        return saving;
    }
    // static async makePayment(kidId, savingId, amount, isScheduledPayment = false) {
    //     const saving = await Saving.findById(savingId);
    //     if (!saving)
    //         throw new Error("Saving goal not found");
    //     if (saving.kidId.toString() !== kidId) {
    //         throw new Error("Not authorized to make payment for this goal");
    //     }
    //     const savingsWallet = await SavingsWallet.findOne({ savingId, kidId });
    //     if (!savingsWallet)
    //         throw new Error("Savings wallet not found");
    //     if (savingsWallet.isCompleted) {
    //         throw new Error("Savings goal already completed");
    //     }
    //     // Check if payment would exceed the goal amount
    //     const newAmount = savingsWallet.currentAmount + amount;
    //     if (newAmount > saving.totalSavingAmount) {
    //         throw new Error(`Payment would exceed goal amount. Maximum additional payment: $${saving.totalSavingAmount - savingsWallet.currentAmount}`);
    //     }
    //     // Deduct from main wallet
    //     const wallet = await Wallet.findOne({ kid: kidId });
    //     if (!wallet)
    //         throw new Error("Wallet not found");
    //     if (wallet.balance < amount) {
    //         throw new Error("Insufficient funds in wallet");
    //     }
    //     wallet.balance -= amount;
    //     await wallet.save();
    //     // Record transaction in ledger
    //     const ledgerTransaction = new LedgerTransaction({
    //         kid: kidId,
    //         wallet: wallet._id,
    //         type: ETransactionType.Debit,
    //         transactionType: ETransactionName.SavingsDeposit,
    //         amount,
    //         description: `Payment to savings goal: ${saving.title}`,
    //     });
    //     await ledgerTransaction.save();
    //     // Update savings wallet
    //     savingsWallet.currentAmount = newAmount;
    //     savingsWallet.payments.push({
    //         amount,
    //         paymentDate: new Date(),
    //         isScheduledPayment
    //     });
    //     // Check if goal is completed
    //     if (Math.abs(newAmount - saving.totalSavingAmount) < 0.01) { // Account for floating point precision
    //         savingsWallet.isCompleted = true;
    //     }
    //     await savingsWallet.save();
    //     return {
    //         saving,
    //         savingsWallet,
    //         progress: this.calculateProgress(savingsWallet.currentAmount, saving.totalSavingAmount)
    //     };
    // }
    // static async withdrawFromSavings(kidId, savingId) {
    //     const saving = await Saving.findById(savingId);
    //     if (!saving)
    //         throw new NotFoundError("Saving goal not found");
    //     const savingsWallet = await SavingsWallet.findOne({ savingId, kidId });
    //     if (!savingsWallet)
    //         throw new NotFoundError("Savings wallet not found");
    //     if (!savingsWallet.isCompleted) {
    //         throw new ForbiddenError("Cannot withdraw from incomplete savings goal");
    //     }
    //     // Get the kid's main wallet
    //     const wallet = await Wallet.findOne({ kid: kidId });
    //     if (!wallet)
    //         throw new NotFoundError("Wallet not found");
    //     // Transfer funds from savings to main wallet
    //     wallet.balance += savingsWallet.currentAmount;
    //     await wallet.save();
    //     // Record transaction in ledger
    //     const ledgerTransaction = new LedgerTransaction({
    //         kid: kidId,
    //         wallet: wallet._id,
    //         type: ETransactionType.Credit,
    //         transactionType: ETransactionName.SavingsWithdrawal,
    //         amount: savingsWallet.currentAmount,
    //         description: `Withdrawal from savings goal: ${saving.title}`,
    //     });
    //     await ledgerTransaction.save();
    //     // Reset savings wallet (or mark as withdrawn)
    //     const withdrawnAmount = savingsWallet.currentAmount;
    //     savingsWallet.currentAmount = 0;
    //     savingsWallet.isCompleted = false; // Optionally keep as completed but track withdrawals
    //     await savingsWallet.save();
    //     return {
    //         amountWithdrawn: withdrawnAmount,
    //         newWalletBalance: wallet.balance
    //     };
    // }
    // static async getSavingsProgress(kidId) {
    //     const savings = await Saving.find({ kidId });
    //     const savingsWithProgress = await Promise.all(savings.map(async (saving) => {
    //         const wallet = await SavingsWallet.findOne({ savingId: saving._id, kidId });
    //         return {
    //             ...saving.toObject(),
    //             currentAmount: wallet?.currentAmount || 0,
    //             progress: this.calculateProgress(wallet?.currentAmount || 0, saving.totalSavingAmount),
    //             isCompleted: wallet?.isCompleted || false,
    //             payments: wallet?.payments || []
    //         };
    //     }));
    //     return savingsWithProgress;
    // }
    // static async getPaymentHistory(kidId, savingId) {
    //     const savingsWallet = await SavingsWallet.findOne({ savingId, kidId });
    //     if (!savingsWallet)
    //         throw new NotFoundError("Savings wallet not found");
    //     return savingsWallet.payments.sort((a, b) => b.paymentDate.getTime() - a.paymentDate.getTime());
    // }
}
export default SavingService;
