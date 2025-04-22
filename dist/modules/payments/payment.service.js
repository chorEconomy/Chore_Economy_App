import Stripe from "stripe";
import * as dotenv from "dotenv";
import express from "express";
import { Kid, Parent } from "../users/user.model.js";
import { Chore } from "../chores/chore.model.js";
import { EChoreStatus, ETransactionName } from "../../models/enums.js";
import WalletService from "../wallets/wallet.service.js";
import { PaymentSchedule } from "./payment.module.js";
import { BadRequestError, NotFoundError, } from "../../models/errors.js";
import sendNotification from "../../utils/notifications.js";
import mongoose from "mongoose";
import { Wallet } from "../wallets/wallet.model.js";
import { Notification } from "../notifications/notification.model.js";
dotenv.config();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
export const stripeWebhook = express.raw({ type: "application/json" });
class PaymentService {
    static async getPaymentDetailsForKid(kidId) {
        const kid = await Kid.findById(kidId);
        if (!kid) {
            throw new NotFoundError("Kid not found");
        }
        const approvedChores = await Chore.find({
            kidId: kid._id,
            status: EChoreStatus.Approved,
        }).exec();
        if (approvedChores.length <= 0) {
            throw new NotFoundError("No approved chores found for this kid");
        }
        const totalAmount = approvedChores.reduce((sum, chore) => sum + chore.earn, 0);
        return {
            kidId: kid._id,
            kidName: kid.name,
            totalAmount,
            approvedChores,
            hasApprovedChores: approvedChores.length > 0,
        };
    }
    static async handleSuccessfulPayment(kidId, parentId, amount, session) {
        console.log(`Starting payment processing for kid ${kidId}, parent ${parentId}, amount ${amount}`);
        try {
            const kid = await this.validateKidAndParent(kidId, parentId, session);
            console.log(`Validated kid and parent`);
    
            const { approvedChores, totalAmount } = await this.getApprovedChoresAndTotalAmount(kidId, session);
            console.log(`Found ${approvedChores.length} approved chores totaling $${totalAmount}`);
    
            await this.addFundsToWallet(kid, amount, session);
            console.log(`Funds added to wallet`);
    
            await this.markChoresAsCompleted(kidId, session);
            console.log(`Chores marked as completed`);
    
            await this.updateParentCanCreateFlag(parentId, session);
            console.log(`Parent canCreate flag updated`);
    
            await this.updateNextDueDate(parentId, session);
            console.log(`Next due date updated`);
    
            await session.commitTransaction();
            console.log(`Transaction committed successfully`);
        } catch (error) {
            console.error("Payment failed:", error);
            if (session) {
                await session.abortTransaction();
                console.log(`Transaction aborted`);
            }
            throw error;
        }
    }
    static async validateKidAndParent(kidId, parentId, session) {
        const kid = await Kid.findById(kidId).session(session);
        const parent = await Parent.findById(parentId).session(session);
        if (!kid) {
            throw new NotFoundError("Kid not found");
        }
        if (!parent) {
            throw new NotFoundError("Parent not found");
        }
        return kid;
    }
    static async processStripePayment(kidId, parentId) {
        let session = null;
        try {
            session = await mongoose.startSession();
            session.startTransaction();
            const { approvedChores, totalAmount } = await this.getApprovedChoresAndTotalAmount(kidId, session);
            if (typeof totalAmount !== "number" || totalAmount <= 0) {
                throw new BadRequestError("Invalid payment amount");
            }
            const amountInCents = Math.round(totalAmount * 100);
            const paymentIntent = await stripe.paymentIntents.create({
                amount: amountInCents,
                currency: "usd",
                metadata: {
                    kidId: kidId.toString(),
                    parentId: parentId.toString()
                }
            });
            await session.commitTransaction();
            return paymentIntent;
        }
        catch (error) {
            console.error("Stripe PaymentIntent creation failed:", error);
            // Handle specific Stripe errors
            if (error.type === "StripeInvalidRequestError") {
                throw new BadRequestError(`Payment processing error: ${error.message}`);
            }
            // Handle rate limiting
            if (error.type === "StripeRateLimitError") {
                throw new BadRequestError("Payment system busy. Please try again shortly.");
            }
            // Generic error fallback
            throw new Error("Failed to process payment. Please try again.");
        }
        finally {
            if (session) {
                session.endSession();
            }
        }
    }
    static async getApprovedChoresAndTotalAmount(kidId, session) {
        const approvedChores = await Chore.find({
            kidId: kidId,
            status: EChoreStatus.Approved,
        }).session(session);
        if (!approvedChores.length) {
            throw new Error("No approved chores found for this kid");
        }
        const totalAmount = approvedChores.reduce((sum, chore) => sum + chore.earn, 0);
        return { approvedChores, totalAmount };
    }
    static async handleStripeWebhook(sig, rawBody) {
        let event;
        try {
            event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
        }
        catch (err) {
            console.error("⚠️  Webhook signature verification failed.", err.message);
            throw new BadRequestError("Webhook signature verification failed.");
        }
        const paymentIntent = event.data.object;
        const { kidId, parentId } = paymentIntent.metadata;
        if (!parentId || !kidId) {
            console.warn('PaymentIntent metadata incomplete or missing');
            throw new Error('PaymentIntent metadata incomplete or missing');
        }
        // Handle different event types
        try {
            const paymentIntent = event.data.object;
            const { kidId, parentId } = paymentIntent.metadata;
            if (!kidId || !parentId) {
                console.error('Missing metadata in payment intent');
                return;
            }
            const session = await mongoose.startSession();
            await session.withTransaction(async () => {
                const amountInDollars = paymentIntent.amount / 100;
                switch (event.type) {
                    case "payment_intent.succeeded":
                        await this.handleSuccessfulPayment(kidId, parentId, amountInDollars, session);
                        await this.sendPaymentNotification(parentId, true, amountInDollars, session);
                        break;
                    case "payment_intent.payment_failed":
                        await this.sendPaymentNotification(parentId, false, amountInDollars, session, paymentIntent.last_payment_error?.message);
                        break;
                }
            });
        }

        catch (err) {
            console.error(`Webhook processing failed: ${err.message}`);
            // Consider dead-letter queue for retries
        }
    }
    static async sendPaymentNotification(parentId, isSuccess, amount, session, errorMessage) {
        const parent = await Parent.findById(parentId).session(session);
        if (!parent || !parent.fcmToken)
            return;
        const title = isSuccess ? "Payment Successful" : "Payment Failed";
        const amountFormatted = `$${(amount / 100).toFixed(2)}`;
        const body = isSuccess
            ? `${amountFormatted} was credited to your account`
            : `${amountFormatted} payment failed: ${errorMessage || "Please try again"}`;
        await Notification.create({
            recipient: {
                id: parent._id,
                role: "Parent",
            },
            recipientId: parent._id,
            title,
            body
        }, { session });
        // 2. Send push notification
        await sendNotification(parent.fcmToken, title, body, {
            paymentId: parentId,
            type: 'payment_update'
        });
    }
    static async addFundsToWallet(kid, totalAmount, session) {
        await WalletService.addFundsToWallet(kid, totalAmount, "Payment for approved chores", ETransactionName.ChorePayment, session);
    }
    static async markChoresAsCompleted(kidId, session) {
        await Chore.updateMany({ kidId: kidId, status: EChoreStatus.Approved }, { status: EChoreStatus.Completed }, { session });
    }
    static async updateNextDueDate(parentId, session) {
        const paymentSchedule = await PaymentSchedule.findOne({
            parentId,
            status: "active",
        }).session(session);
        if (paymentSchedule) {
            let nextDueDate;
            switch (paymentSchedule.scheduleType) {
                case "weekly":
                    nextDueDate = new Date(paymentSchedule.nextDueDate.setDate(paymentSchedule.nextDueDate.getDate() + 7));
                    break;
                case "biweekly":
                    nextDueDate = new Date(paymentSchedule.nextDueDate.setDate(paymentSchedule.nextDueDate.getDate() + 14));
                    break;
                case "monthly":
                    nextDueDate = new Date(paymentSchedule.nextDueDate.setMonth(paymentSchedule.nextDueDate.getMonth() + 1));
                    break;
                default:
                    throw new Error("Invalid schedule type");
            }
            paymentSchedule.nextDueDate = nextDueDate;
            await paymentSchedule.save({ session });
        }
    }
    static async updateParentCanCreateFlag(parentId, session) {
        await Parent.findByIdAndUpdate(parentId, { canCreate: true }, { session });
    }
    static async createSchedule(parentId, scheduleType, startDate) {
        const start = new Date(startDate);
        if (isNaN(start.getTime())) {
            throw new BadRequestError("Invalid start date");
        }
        let nextDueDate;
        switch (scheduleType) {
            case "weekly":
                nextDueDate = new Date(start.setDate(start.getDate() + 7));
                break;
            case "biweekly":
                nextDueDate = new Date(start.setDate(start.getDate() + 14));
                break;
            case "monthly":
                nextDueDate = new Date(start.setMonth(start.getMonth() + 1));
                break;
            default:
                throw new Error("Invalid schedule type");
        }
        // Create a new payment schedule
        const paymentSchedule = new PaymentSchedule({
            parent: parentId,
            scheduleType,
            startDate,
            nextPaymentDate: nextDueDate,
        });
        await paymentSchedule.save();
        return paymentSchedule;
    }
    static async withdrawMoney(kid) {
        const wallet = await Wallet.findOne({ kid: kid._id });
        if (!wallet)
            throw new NotFoundError("Wallet not found");
        const updatedWallet = await WalletService.deductFundsFromWallet(kid._id, wallet._id, wallet.mainBalance, "Withdrawal from wallet", ETransactionName.Withdrawal);
        return updatedWallet;
    }
    static async checkDuePayments() {
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        // Find all parents with unpaid chores
        const unpaidChores = await Chore.find({
            status: "approved", // Only consider unpaid chores
        }).populate("parentId");
        // Group unpaid chores by parent
        const parentsWithUnpaidChores = {};
        for (const chore of unpaidChores) {
            const parentId = chore.parentId._id.toString();
            if (!parentsWithUnpaidChores[parentId]) {
                parentsWithUnpaidChores[parentId] = {
                    parent: chore.parentId,
                    unpaidChores: [],
                };
            }
            parentsWithUnpaidChores[parentId].unpaidChores.push(chore);
        }
        // Iterate through parents with unpaid chores
        for (const parentId in parentsWithUnpaidChores) {
            const { parent, unpaidChores } = parentsWithUnpaidChores[parentId];
            // Find the parent's payment schedule
            const paymentSchedule = await PaymentSchedule.findOne({
                parentId: parent._id,
                status: "active",
            });
            if (paymentSchedule) {
                // Cast paymentSchedule to 'any' to access nextDueDate
                const schedule = paymentSchedule;
                // Check if today is the day before the due date
                if (schedule.nextDueDate.getTime() === tomorrow.getTime()) {
                    // Send 24-hour reminder
                    const notification = await Notification.create({
                        recipient: {
                            id: parent._id,
                            role: "Parent",
                        },
                        recipientId: parent._id,
                        title: "Payment Reminder",
                        message: `Reminder: You have unpaid chores. Payment is due tomorrow.`
                    });
                    await sendNotification(parent.fcmToken, notification.title, notification.message, { notificationId: notification._id });
                }
                // Check if today is the due date
                if (schedule.nextDueDate.getTime() === today.getTime()) {
                    // Send due date notification
                    const notification = await Notification.create({
                        recipient: {
                            id: parent._id,
                            role: "Parent",
                        },
                        recipientId: parent._id,
                        title: "Payment Due",
                        message: `Reminder: You have unpaid chores. Payment is due today.`
                    });
                    await sendNotification(parent.fcmToken, notification.title, notification.message, { notificationId: notification._id });
                }
                // Check if today is 24 hours after the due date
                const twentyFourHoursAfterDueDate = new Date(schedule.nextDueDate);
                twentyFourHoursAfterDueDate.setDate(twentyFourHoursAfterDueDate.getDate() + 1);
                if (today.getTime() === twentyFourHoursAfterDueDate.getTime()) {
                    // Restrict parent from creating new chores or expenses
                    await Parent.findByIdAndUpdate(parent._id, { canCreate: false });
                    const notification = await Notification.create({
                        recipient: {
                            id: parent._id,
                            role: "Parent",
                        },
                        recipientId: parent._id,
                        title: "Payment Overdue",
                        message: `You have missed the payment deadline. You cannot create new chores or expenses until you complete your overdue payment.`
                    });
                    // Send restriction notification
                    await sendNotification(parent.fcmToken, notification.title, notification.message, { notificationId: notification._id });
                }
            }
        }
        return {
            success: true,
            message: "Notifications sent successfully",
        };
    }
}
export default PaymentService;
