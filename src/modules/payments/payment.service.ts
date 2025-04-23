import Stripe from "stripe";
import * as dotenv from "dotenv";
import express from "express";
import { Kid, Parent } from "../users/user.model.js";
import { Chore } from "../chores/chore.model.js";

import { EChoreStatus, ETransactionName } from "../../models/enums.js";
import WalletService from "../wallets/wallet.service.js";
import { PaymentSchedule } from "./payment.module.js";
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
} from "../../models/errors.js";
import sendNotification from "../../utils/notifications.js";
import mongoose, { ClientSession, ObjectId } from "mongoose";
import { Wallet } from "../wallets/wallet.model.js";
import {Notification} from "../notifications/notification.model.js";
import { check_if_user_exists } from "../../utils/check_user_exists.utils.js";
import ledgerModel from "../ledgers/ledger.model.js";
dotenv.config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET as string;

export const stripeWebhook = express.raw({ type: "application/json" })

class PaymentService {
  static async getPaymentDetailsForKid(kidId: any) {
    const kid: any = await Kid.findById(kidId);

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

        const totalAmount = approvedChores.reduce(
          (sum, chore) => sum + chore.earn,
          0
        );
    
        return {
          kidId: kid._id,
          kidName: kid.name,
          totalAmount,
          approvedChores,
          hasApprovedChores: approvedChores.length > 0,
        }; 
    
  }


  static async handleStripeWebhook(sig: string, rawBody: Buffer): Promise<{ success: boolean; message?: string }> {
    let event: Stripe.Event | undefined;
    let session: mongoose.ClientSession | null = null;
    
    try {
        // 1. Verify webhook signature
        event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
        
        // 2. Only process specific payment_intent events
        if (!['payment_intent.succeeded', 'payment_intent.payment_failed'].includes(event.type)) {
            console.log(`Skipping event: ${event.type}`);
            return { success: true, message: `Skipped ${event.type}` };
        }
        
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const { kidId, parentId } = paymentIntent.metadata || {};
        
        // 3. Validate metadata
        if (!kidId || !parentId) {
            throw new BadRequestError('PaymentIntent missing required metadata');
        }
        
        const amountInDollars: number = paymentIntent.amount / 100;
        
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
                
                return { success: true };
            } catch (error) {
                // Handle transaction errors
                if (session.inTransaction()) {
                    await session.abortTransaction().catch((abortError: Error) => {
                        console.error('Abort transaction error:', abortError);
                    });
                }
                throw error;
            }
        } else if (event.type === 'payment_intent.payment_failed') {
            // For failed payments, just send notification (no transaction needed)
            const errorMessage = paymentIntent.last_payment_error?.message || '';
            await this.sendPaymentNotification(parentId, false, amountInDollars, errorMessage);
            return { success: true };
        }
        
        // Fallback return for typescript compiler (should never reach here)
        return { success: false, message: "Unhandled event type" };
    }
    catch (err: any) {
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
            } catch (e: any) {
                console.error('Session end error:', e);
            }
        }
    }
}
  

  private static async validateKidAndParent(
    kidId: any,
    parentId: any,
    session: ClientSession
  ) {
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

  static async processStripePayment(kidId: any, parentId: any) {
    let session: ClientSession | null = null;
    try { 
      session = await mongoose.startSession();
      session.startTransaction();
      const {approvedChores, totalAmount} = await this.getApprovedChoresAndTotalAmount(kidId, session);

      if (typeof totalAmount !== "number" || totalAmount <= 0) {
        throw new BadRequestError("Invalid payment amount");
      }
 
      const amountInCents = Math.round(totalAmount * 100);
 
      const paymentIntent: any = await stripe.paymentIntents.create({
        amount: amountInCents,
        currency: "usd",
        metadata: { 
          kidId: kidId.toString(),
          parentId: parentId.toString()
        }
      });
      
      await session.commitTransaction();

      return paymentIntent;
    } catch (error: any) {
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
    } finally {
      if (session) {
        session.endSession();
      }
    }
  }

  private static async getApprovedChoresAndTotalAmount(
    kidId: any,
    session: ClientSession
  ) {
    const approvedChores = await Chore.find({
      kidId: kidId,
      status: EChoreStatus.Approved,
    }).session(session);

    if (!approvedChores.length) {
      throw new Error("No approved chores found for this kid");
    }

    const totalAmount = approvedChores.reduce(
      (sum, chore) => sum + chore.earn,
      0
    );

    return { approvedChores, totalAmount };
  }

 

  private static async sendPaymentNotification(
    parentId: string,
    isSuccess: boolean,
    amount: number,  
    errorMessage?: string,
  ) {
    const parent = await Parent.findById(parentId);
    if (!parent || !parent.fcmToken) return;
  
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
  

  private static async addFundsToWallet(
    kid: any,
    totalAmount: number,
    session: ClientSession
  ) {
    await WalletService.addFundsToWallet(
      kid,
      totalAmount,
      "Payment for approved chores",
      ETransactionName.ChorePayment,
      session
    );
  }

  private static async markChoresAsCompleted(
    kidId: any,
    session: ClientSession
  ) {
    await Chore.updateMany(
      { kidId: kidId, status: EChoreStatus.Approved },
      { status: EChoreStatus.Completed },
      { session }
    );
  }

  private static async updateNextDueDate(
    parentId: any,
    session: ClientSession
  ) {
    const paymentSchedule: any = await PaymentSchedule.findOne({
      parentId,
      status: "active",
    }).session(session);

    if (paymentSchedule) {
      let nextDueDate: Date;

      switch (paymentSchedule.scheduleType) {
        case "weekly":
          nextDueDate = new Date(
            paymentSchedule.nextDueDate.setDate(
              paymentSchedule.nextDueDate.getDate() + 7
            )
          );
          break;
        case "biweekly":
          nextDueDate = new Date(
            paymentSchedule.nextDueDate.setDate(
              paymentSchedule.nextDueDate.getDate() + 14
            )
          );
          break;
        case "monthly":
          nextDueDate = new Date(
            paymentSchedule.nextDueDate.setMonth(
              paymentSchedule.nextDueDate.getMonth() + 1
            )
          );
          break;
        default:
          throw new Error("Invalid schedule type");
      }

      paymentSchedule.nextDueDate = nextDueDate;
      await paymentSchedule.save({ session });
    }
  }

  private static async updateParentCanCreateFlag(
    parentId: any,
    session: ClientSession
  ) {
    await Parent.findByIdAndUpdate(parentId, { canCreate: true }, { session });
  }

  static async createSchedule(
    parentId: any,
    scheduleType: string,
    startDate: Date
  ) {
    const start = new Date(startDate);

    if (isNaN(start.getTime())) {
      throw new BadRequestError("Invalid start date");
    }

    let nextDueDate: Date;

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

  static async withdrawMoney(kid: any) {
    const wallet = await Wallet.findOne({ kid: kid._id });
   
    if (!wallet) throw new NotFoundError("Wallet not found");

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
    const parentsWithUnpaidChores: any = {};
    for (const chore of unpaidChores) {
      const parentId = (chore.parentId as any)._id.toString();
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
        const schedule = paymentSchedule as any;

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
  
          await sendNotification(
            parent.fcmToken,
            notification.title,
            notification.message,
            { notificationId: notification._id }
          );
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

          await sendNotification(
            parent.fcmToken,
            notification.title,
            notification.message,
            { notificationId: notification._id }
          );
        }

        // Check if today is 24 hours after the due date
        const twentyFourHoursAfterDueDate = new Date(schedule.nextDueDate);
        twentyFourHoursAfterDueDate.setDate(
          twentyFourHoursAfterDueDate.getDate() + 1
        );

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
            message:  `You have missed the payment deadline. You cannot create new chores or expenses until you complete your overdue payment.`
          });
          // Send restriction notification
          await sendNotification(
            parent.fcmToken,
            notification.title,
            notification.message,
            { notificationId: notification._id }
          );
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
