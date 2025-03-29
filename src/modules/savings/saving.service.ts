import { ESavingSchedule, ETransactionName, ETransactionType } from "../../models/enums.js";
import calculateEndDate from "../../utils/converter.utils.js";
import paginate from "../../utils/paginate.js";
import { Kid } from "../users/user.model.js";
import { Wallet } from "../wallets/wallet.model.js";
import LedgerTransaction from "../ledgers/ledger.model.js";
import { IPayment, ISavingsGoal, Saving, SavingsWallet } from "./saving.model.js";
import { BadRequestError, ForbiddenError, NotFoundError } from "../../models/errors.js";
import mongoose, {ObjectId} from "mongoose";
import WalletService from "../wallets/wallet.service.js";
import sendNotification from "../../utils/notifications.js";
import SavingUtils from "./saving.utils.js";

class SavingService {
    static async createSaving(data: any, kidId: ObjectId) {
        const { title, startDate, totalSavingAmount, schedule, amountFrequency } = data

        if (!title || !startDate || !totalSavingAmount || !schedule || !amountFrequency) {
            throw new BadRequestError("Missing required fields");
        }

        if (typeof totalSavingAmount !== 'number' || totalSavingAmount <= 0) {
            throw new BadRequestError("Invalid savings amount");
        }
    
        if (typeof amountFrequency !== 'number' || amountFrequency <= 0) {
            throw new BadRequestError("Invalid frequency amount");
        }
        
        const validSchedules = Object.values(ESavingSchedule);
        if (!validSchedules.includes(schedule.toLowerCase() as ESavingSchedule)) {
            throw new BadRequestError(`Invalid schedule type. Valid types are: ${validSchedules.join(', ')}`);
        }
        
        const endDate = calculateEndDate(startDate, totalSavingAmount, amountFrequency, schedule.toLowerCase() as ESavingSchedule)

        const saving = await new Saving({
            kidId,
            title: title.trim(),
            startDate: new Date(startDate),
            endDate,
            totalSavingAmount,
            amountFrequency,
            nextDueDate: SavingUtils.calculateNextDueDate(startDate, schedule),
            schedule: schedule?.toLowerCase() as ESavingSchedule,
            payments: [],
            isCompleted: false
        })

        await saving.save();

        return saving
    }

    static async fetchSaving(id: string, kidId: ObjectId) {
        const saving = await Saving.findOne({ kidId: kidId, _id: id })
        return saving
    }

    static async deleteSaving(id: string, kidId: ObjectId) {
        const saving = await Saving.findOneAndDelete({ kidId: kidId, _id: id });
        return saving;
    }

    private static async validateSavingsInput(
        amount: number,
        savingId: any,
        kidId: ObjectId
    ) {
        if (amount <= 0) {
            throw new BadRequestError("Amount must be greater than zero");
        }

        const saving = await Saving.findOne({_id: savingId});
        if (!saving) throw new BadRequestError("Savings goal not found");
        
        if (saving.isCompleted) {
            throw new BadRequestError("Cannot add to completed savings goal");
        }

        const mainWallet = await Wallet.findOne({ kid: kidId });
        if (!mainWallet) throw new BadRequestError("Main wallet not found");
        
        if (mainWallet.balance < amount) {
            throw new BadRequestError("Insufficient funds in main wallet");
        }

        const savingsWallet = await SavingsWallet.findOne({ kid: kidId });
        if (!savingsWallet) throw new BadRequestError("Savings wallet not found");

        return { saving, mainWallet, savingsWallet };
    }

    private static async transferToSavings(
        kidId: ObjectId,
        amount: number,
        saving: any,
        mainWallet: any,
        savingsWallet: any,
        isScheduledPayment: boolean,
        session: mongoose.ClientSession
    ) {
      

        const kid = await Kid.findById(kidId);

        await WalletService.deductFundsFromWallet(kid, amount, `Deposit to savings: ${saving.title}`, ETransactionName.SavingsContribution, session);

        // 3. Add to savings wallet and update goal
        savingsWallet.balance += amount;
        await this.updateSavingsWalletGoal(savingsWallet, saving._id, amount, session);

        // 4. Record savings wallet transaction
        await this.recordTransaction(
            kidId,
            savingsWallet._id,
            ETransactionType.Credit,
            ETransactionName.SavingsContribution,
            amount,
            `Deposit to savings: ${saving.title}`,
            session
        );

        // 5. Update saving document
        saving.payments.push({
            amount,
            date: new Date(),
            isScheduledPayment
        });

        const totalSaved = saving.payments.reduce((sum: number, payment: any) => sum + payment.amount, 0);
        saving.isCompleted = totalSaved >= saving.totalSavingAmount;
        await saving.save({ session });

        // return { 
        //     mainWallet, 
        //     savingsWallet,
        //     saving,
        //     isGoalCompleted: saving.isCompleted
        // };
        return { 
            isGoalCompleted: saving.isCompleted
        };
    }

    private static async updateSavingsWalletGoal(
        savingsWallet: any,
        savingId: ObjectId,
        amount: number,
        session: mongoose.ClientSession
    ) {
        const goalIndex = savingsWallet.savingsGoals.findIndex(
            (goal: any) => goal.savingId.toString() === savingId
        );
        
        if (goalIndex >= 0) {
            savingsWallet.savingsGoals[goalIndex].amountSaved += amount;
        } else {
            savingsWallet.savingsGoals.push({
                savingId,
                amountSaved: amount
            });
        }
        
        await savingsWallet.save({ session });
    }

    private static async recordTransaction(
        kidId: ObjectId,
        walletId: ObjectId,
        type: ETransactionType,
        transactionType: ETransactionName,
        amount: number,
        description: string,
        session: mongoose.ClientSession
    ) {
        const transaction = new LedgerTransaction({
            kid: kidId,
            wallet: walletId,
            type,
            transactionType,
            amount,
            description,
        });
        await transaction.save({ session });
    }

    static async addToSavings(
        kidId: ObjectId,
        savingId: any,
        amount: number,
        isScheduledPayment = false
    ) {
        // Validate input
        const { saving, mainWallet, savingsWallet } = 
            await this.validateSavingsInput(amount, savingId, kidId);

        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            // Process all transactions and updates in one call
            const result = await this.transferToSavings(
                kidId,
                amount,
                saving,
                mainWallet,
                savingsWallet,
                isScheduledPayment,
                session
            );

            await session.commitTransaction();
            return { success: true, ...result };

        } catch (error) {
            await session.abortTransaction();
            throw error;
        } finally {
            session.endSession();
        }
    }

    static async withdrawFromSavings(kidId: ObjectId, savingId: string) {
        const saving = await Saving.findById(savingId);
        if (!saving) throw new NotFoundError("Savings goal not found");
        
        if (!saving.isCompleted) throw new ForbiddenError("Cannot withdraw from incomplete savings goal");

        const wallet = await SavingsWallet.findOne({ kid: kidId });
        if (!wallet) throw new NotFoundError("Savings wallet not found");

        // Find the savings goal in the wallet
        const savingsGoal = wallet.savingsGoals.find((goal: ISavingsGoal) => goal.savingId.toString() === savingId);
        if (!savingsGoal) throw new NotFoundError("Savings goal not found in wallet");

        // Transfer to main wallet (implement this in WalletService)
        await WalletService.addFundsToWallet(
            kidId,
            savingsGoal.amountSaved,
            `Withdrawal from savings: ${saving.title}`,
            ETransactionName.SavingsWithdrawal
        );

        // Update savings wallet
        wallet.balance -= savingsGoal.amountSaved;
        wallet.savingsGoals = wallet.savingsGoals.filter((goal: ISavingsGoal) => goal.savingId.toString() !== savingId);
        await wallet.save();

        return { amount: savingsGoal.amountSaved };
    }

  
    static async getSavingsHistory(kidId: ObjectId, savingId: string) {
        const saving = await Saving.findById({kidId: kidId, _id: savingId});

        if (!saving) throw new NotFoundError("Saving goal not found");
        
        return saving.payments.map((payment: IPayment) => ({
            amount: payment.amount,
            date: payment.date,
            isScheduledPayment: payment.isScheduledPayment
        }));
    }

    static async getAllSavingsGoals(kidId: string) {
        const savings = await Saving.find({ kidId });
        
        const savingsWallet = await SavingsWallet.findOne({ kid: kidId });
        
        return savings.map((saving: any) => {
            const totalSaved = saving.payments.reduce((sum: number, payment: IPayment ) => sum + payment.amount, 0);
            
            const progressPercentage = Math.min(100, Math.round((totalSaved / saving.totalSavingAmount) * 100));
          
            return {
                _id: saving._id,
                title: saving.title,
                startDate: saving.startDate,
                endDate: saving.endDate,
                totalSavingAmount: saving.totalSavingAmount,
                totalSaved, // Sum of all payments
                progressPercentage, // 0-100%
                amountLeft: saving.totalSavingAmount - totalSaved,
                isCompleted: saving.isCompleted
            };
        });
    }

    static async checkAndSendReminders() {
        const today = new Date();
        const savings = await Saving.find({ 
            isCompleted: false,
        }).populate('kidId');
        
        for (const saving of savings) {
            try {
                const lastPaymentDate = saving.payments.length > 0 ? 
                    new Date(Math.max(...saving.payments.map((p: IPayment )=> new Date(p.date).getTime()))) : 
                    saving.startDate;
                
                if (SavingUtils.shouldSendReminder(today, lastPaymentDate, saving.schedule)) {
                    if (saving.kidId.fcmToken) {
                        await sendNotification(
                            saving.kidId.fcmToken,
                            "Savings Reminder",
                            `Time to make your ${saving.schedule} payment for: ${saving.title}`
                        );
                    }

                    // Update nextDueDate to the new calculated due date
                    saving.nextDueDate = SavingUtils.calculateNextDueDate(
                        lastPaymentDate, 
                        saving.schedule
                    ); 
                    
                    await saving.save();

                    console.log(`Sent reminder for saving ${saving._id}, next due: ${saving.nextDueDate}`);
                }
            } catch (error) {
                console.error(`Error processing saving ${saving._id}:`, error);
                // Continue with next saving even if one fails
            }
        }
    }
} 

export default SavingService