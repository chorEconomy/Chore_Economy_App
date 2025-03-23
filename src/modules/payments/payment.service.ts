import Stripe from "stripe";
import * as dotenv from "dotenv";
import { Kid, User } from "../users/user.model.js";
import { Chore } from "../chores/chore.model.js";

import {
  EChoreStatus,
  ETransactionName, 
} from "../../models/enums.js";
import WalletService from "../wallets/wallet.service.js";
import { PaymentSchedule } from "./payment.module.js";
import { BadRequestError, NotFoundError } from "../../models/errors.js";
import sendNotification from "../../utils/notifications.js"; 
dotenv.config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

class PaymentService {
  static async getKidsWithApprovedChores(parentId: any) {
    const kids = await Kid.find({ parentId });

    if (!kids.length) {
      throw new Error("No kids found for this parent");
    }

    const kidsWithChores = await Promise.all(
      kids.map(async (kid) => {
        const approvedChores = await Chore.find({
          kidId: kid._id,
          status: EChoreStatus.Approved,
        }).exec();

        if (!approvedChores.length) {
          throw new Error(`No approved chores found for kid: ${kid.name}`);
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
        };
      })
    );

    return kidsWithChores;
  }

  static async validateKidAndParent(kidId: any, parentId: any) {
    const kid = await Kid.findById(kidId);
    const parent = await User.findById(parentId);

    if (!kid) {
      throw new Error("Kid not found");
    }
    if (!parent) {
      throw new Error("Parent not found");
    }

    return kid;
  }

  static async getApprovedChoresAndTotalAmount(kidId: any) {
    const approvedChores = await Chore.find({
      kidId: kidId,
      status: EChoreStatus.Approved,
    });

    if (!approvedChores.length) {
      throw new Error("No approved chores found for this kid");
    }

    const totalAmount = approvedChores.reduce(
      (sum, chore) => sum + chore.earn,
      0
    );

    return { approvedChores, totalAmount };
  }

  static async processStripePayment(
    totalAmount: number,
    paymentMethodId: string
  ) {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: totalAmount * 100, // Convert to cents
      currency: "usd",
      payment_method: paymentMethodId,
      confirm: true,
      off_session: true, // Allow payments without user interaction
      error_on_requires_action: true, // Fail if additional action is required
    });

    return paymentIntent;
  }

  static async addFundsToWallet(kid: any, totalAmount: number) {
    await WalletService.addFunds(
      kid,
      totalAmount,
      "Payment for approved chores",
      ETransactionName.ChorePayment
    );
  }

  static async markChoresAsCompleted(kidId: any) {
    await Chore.updateMany(
      { kidId: kidId, status: EChoreStatus.Approved },
      { status: EChoreStatus.Completed }
    );
  }

  static async updateParentCanCreateFlag(parentId: any) {
    await User.findByIdAndUpdate(parentId, { canCreate: true });
  }

  static async updateNextDueDate(parentId: any) {
    const paymentSchedule: any = await PaymentSchedule.findOne({
      parentId,
      status: "active",
    });

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
      await paymentSchedule.save();
    }
  }

  static async processPayment(
    kidId: any,
    parentId: any,
    paymentMethodId: string
  ) {
    try {
      // Validate kid and parent
      const kid = await this.validateKidAndParent(kidId, parentId);

      // Get approved chores and calculate total amount
      const { approvedChores, totalAmount } =
        await this.getApprovedChoresAndTotalAmount(kidId);

      // Process payment via Stripe
      const paymentIntent = await this.processStripePayment(
        totalAmount,
        paymentMethodId
      );

      // Add funds to the kid's wallet
      await this.addFundsToWallet(kid, totalAmount);

      // Mark chores as completed
      await this.markChoresAsCompleted(kidId);

      // Update parent's canCreate flag
      await this.updateParentCanCreateFlag(parentId);

      // Update the nextDueDate for the parent's payment schedule
      await this.updateNextDueDate(parentId);

      return paymentIntent;
    } catch (error: any) {
      console.error("Payment failed:", error);
      throw new Error(`Payment failed: ${error.message}`);
    }
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
          await sendNotification(
            (parent as any).fcmToken,
            "Payment Reminder",
            `Reminder: You have unpaid chores. Payment is due tomorrow.`
          );
        }

        // Check if today is the due date
        if (schedule.nextDueDate.getTime() === today.getTime()) {
          // Send due date notification
          await sendNotification(
            (parent as any).fcmToken,
            "Payment Due",
            `Reminder: You have unpaid chores. Payment is due today.`
          );
        }

        // Check if today is 24 hours after the due date
        const twentyFourHoursAfterDueDate = new Date(schedule.nextDueDate);
        twentyFourHoursAfterDueDate.setDate(
          twentyFourHoursAfterDueDate.getDate() + 1
        );

        if (today.getTime() === twentyFourHoursAfterDueDate.getTime()) {
          // Restrict parent from creating new chores or expenses
          await User.findByIdAndUpdate(parent._id, { canCreate: false });

          // Send restriction notification
          await sendNotification(
            (parent as any).fcmToken,
            "Payment Overdue",
            `You have missed the payment deadline. You cannot create new chores or expenses until you complete your overdue payment.`
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
