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
            return [];
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
    static async handleStripeWebhook(sig, rawBody) {
        let event;
        let session = null;
        try {
            // 1. Verify webhook signature
            event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
            // 2. Only process specific payment_intent events
            if (!['payment_intent.succeeded', 'payment_intent.payment_failed'].includes(event.type)) {
                console.log(`Skipping event: ${event.type}`);
                return { success: true, message: `Skipped ${event.type}` };
            }
            let paymentIntent = event.data.object;
            const { kidId, parentId } = paymentIntent.metadata || {};
            // 3. Validate metadata
            if (!kidId || !parentId) {
                throw new BadRequestError('PaymentIntent missing required metadata');
            }
            const amountInDollars = paymentIntent.amount / 100;
            // 4. Process based on event type
            if (event.type === 'payment_intent.succeeded') {
                // Create a fresh session for successful payment processing
                session = await mongoose.startSession();
                try {
                    session.startTransaction();
                    // Process the payment with this session
                    const kid = await this.validateKidAndParent(kidId, parentId, session);
                    if (!kid) {
                        throw new NotFoundError("Kid not found");
                    }
                    await this.addFundsToWallet(kid, amountInDollars, session);
                    await this.markChoresAsCompleted(kidId, session);
                    await this.updateParentCanCreateFlag(parentId, session);
                    await this.updateNextDueDate(parentId, session);
                    await session.commitTransaction();
                    await this.sendPaymentNotification(parentId, true, amountInDollars);
                    // Commit the transaction
                    console.log("succeeded", paymentIntent.id);
                    return { success: true };
                }
                catch (error) {
                    // Handle transaction errors
                    if (session.inTransaction()) {
                        await session.abortTransaction().catch((abortError) => {
                            console.error('Abort transaction error:', abortError);
                        });
                    }
                    throw error;
                }
            }
            else if (event.type === 'payment_intent.payment_failed') {
                // For failed payments, just send notification (no transaction needed)
                const errorMessage = paymentIntent.last_payment_error?.message || '';
                await this.sendPaymentNotification(parentId, false, amountInDollars, errorMessage);
                console.log("failed", paymentIntent.id, errorMessage);
                return { success: true };
            }
            // Fallback return for typescript compiler (should never reach here)
            return { success: false, message: "Unhandled event type" };
        }
        catch (err) {
            console.error(`Webhook processing failed: ${err.message}`, {
                event_id: event?.id,
                error: err.stack
            });
            throw err;
        }
        finally {
            // Always end the session if it exists
            if (session) {
                try {
                    await session.endSession();
                }
                catch (e) {
                    console.error('Session end error:', e);
                }
            }
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
    static async sendPaymentNotification(parentId, isSuccess, amount, errorMessage) {
        const parent = await Parent.findById(parentId);
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
            title: title,
            message: body,
        });
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
            nextDueDate: nextDueDate,
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
    //   static async checkDuePayments() {
    //     const today = new Date();
    //     const tomorrow = new Date(today);
    //     tomorrow.setDate(tomorrow.getDate() + 1);
    //     const yesterday = new Date(today);
    //             yesterday.setDate(yesterday.getDate() - 1);
    //     today.setHours(0, 0, 0, 0);
    // tomorrow.setHours(0, 0, 0, 0);
    // yesterday.setHours(0, 0, 0, 0);
    //     // Find all parents with unpaid chores
    //     const unpaidChores = await Chore.find({
    //       status: "approved", // Only consider unpaid chores
    //     }).populate("parentId");
    //     // Group unpaid chores by parent
    //     const parentsWithUnpaidChores: any = {};
    //     for (const chore of unpaidChores) {
    //       const parentId = (chore.parentId as any)._id.toString();
    //       if (!parentsWithUnpaidChores[parentId]) {
    //         parentsWithUnpaidChores[parentId] = {
    //           parent: chore.parentId,
    //           unpaidChores: [],
    //         };
    //       }
    //       parentsWithUnpaidChores[parentId].unpaidChores.push(chore);
    //     }
    //     // Iterate through parents with unpaid chores
    //     for (const parentId in parentsWithUnpaidChores) {
    //       const { parent, unpaidChores } = parentsWithUnpaidChores[parentId];
    //       // Find the parent's payment schedule
    //       const paymentSchedule = await PaymentSchedule.findOne({
    //         parent: parent._id,
    //         status: "active",
    //       });
    //       if (paymentSchedule) {
    //         // Cast paymentSchedule to 'any' to access nextDueDate
    //         const schedule = paymentSchedule as any;
    //         // Check if today is the day before the due date
    //         if (schedule.nextDueDate.getTime() === tomorrow.getTime()) {
    //           // Send 24-hour reminder
    //           const notification = await Notification.create({
    //             recipient: {
    //               id: parent._id,
    //               role: "Parent",
    //             },
    //             recipientId: parent._id,
    //             title: "Payment Reminder",
    //             message: `Reminder: You have unpaid chores. Payment is due tomorrow.`
    //           });
    //           await sendNotification(
    //             parent.fcmToken,
    //             notification.title,
    //             notification.message,
    //             { notificationId: notification._id }
    //           );
    //         }
    //         // Check if today is the due date
    //         if (schedule.nextDueDate.getTime() === today.getTime()) {
    //           // Send due date notification
    //           const notification = await Notification.create({
    //             recipient: {
    //               id: parent._id,
    //               role: "Parent",
    //             },
    //             recipientId: parent._id,
    //             title: "Payment Due",
    //             message: `Reminder: You have unpaid chores. Payment is due today.`
    //           });
    //           await sendNotification(
    //             parent.fcmToken,
    //             notification.title,
    //             notification.message,
    //             { notificationId: notification._id }
    //           );
    //         }
    //         // Check if today is 24 hours after the due date
    //         const twentyFourHoursAfterDueDate = new Date(schedule.nextDueDate);
    //         twentyFourHoursAfterDueDate.setDate(
    //           twentyFourHoursAfterDueDate.getDate() + 1
    //         );
    //         if (today.getTime() === twentyFourHoursAfterDueDate.getTime()) {
    //           // Restrict parent from creating new chores or expenses
    //           await Parent.findByIdAndUpdate(parent._id, { canCreate: false });
    //           const notification = await Notification.create({
    //             recipient: {
    //               id: parent._id,
    //               role: "Parent",
    //             },
    //             recipientId: parent._id,
    //             title: "Payment Overdue",
    //             message:  `You have missed the payment deadline. You cannot create new chores or expenses until you complete your overdue payment.`
    //           });
    //           // Send restriction notification
    //           await sendNotification(
    //             parent.fcmToken,
    //             notification.title,
    //             notification.message,
    //             { notificationId: notification._id }
    //           );
    //         }
    //       }
    //     }
    //     return {
    //       success: true,
    //       message: "Notifications sent successfully",
    //     };
    //   }
    static async checkDuePayments() {
        console.log("Checking for due payments...");
        // const today = new Date(Date.UTC(2025, 4, 15));
        const now = new Date();
        const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
        const tomorrow = new Date(today);
        const yesterday = new Date(today);
        tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
        yesterday.setUTCDate(yesterday.getUTCDate() - 1);
        console.log("Today:", today.toISOString());
        console.log("Tomorrow:", tomorrow.toISOString());
        console.log("Yesterday:", yesterday.toISOString());
        const unpaidChores = await Chore.find({ status: "approved" }).populate("parentId");
        console.log("Unpaid chores found:", unpaidChores.length);
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
        for (const parentId in parentsWithUnpaidChores) {
            const { parent } = parentsWithUnpaidChores[parentId];
            const paymentSchedule = await PaymentSchedule.findOne({
                parent: parent._id,
                status: "active",
            });
            if (!paymentSchedule)
                continue;
            const nextDueDate = new Date(paymentSchedule.nextDueDate);
            nextDueDate.setUTCHours(0, 0, 0, 0);
            if (nextDueDate.getTime() === tomorrow.getTime()) {
                const notification = await Notification.create({
                    recipient: { id: parent._id, role: "Parent" },
                    recipientId: parent._id,
                    title: "Payment Reminder",
                    message: "Reminder: You have unpaid chores. Payment is due tomorrow.",
                });
                console.log("Reminder before due date");
                await sendNotification(parent.fcmToken, notification.title, notification.message, {
                    notificationId: notification._id,
                });
            }
            if (nextDueDate.getTime() === today.getTime()) {
                const notification = await Notification.create({
                    recipient: { id: parent._id, role: "Parent" },
                    recipientId: parent._id,
                    title: "Payment Due",
                    message: "Reminder: You have unpaid chores. Payment is due today.",
                });
                console.log("Reminder on due date");
                await sendNotification(parent.fcmToken, notification.title, notification.message, {
                    notificationId: notification._id,
                });
            }
            // const afterDue = new Date(nextDueDate);
            // afterDue.setUTCDate(afterDue.getUTCDate() + 1);
            if (today.getTime() > nextDueDate.getTime()) {
                await Parent.findByIdAndUpdate(parent._id, { canCreate: false });
                const notification = await Notification.create({
                    recipient: { id: parent._id, role: "Parent" },
                    recipientId: parent._id,
                    title: "Payment Overdue",
                    message: "You missed the payment deadline. You can't create chores or expenses until you pay.",
                });
                console.log("Reminder for overdue date");
                await sendNotification(parent.fcmToken, notification.title, notification.message, {
                    notificationId: notification._id,
                });
            }
        }
        return {
            success: true,
            message: "Notifications sent successfully",
        };
    }
}
export default PaymentService;
