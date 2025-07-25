import { status_codes } from "../../utils/status_constants.js";
import PaymentService from "./payment.service.js";
import asyncHandler from "express-async-handler";
import { BadRequestError, UnauthorizedError } from "../../models/errors.js";
import { Kid, Parent } from "../users/user.model.js";
import dotenv from 'dotenv';
dotenv.config();
const CRON_SECRET = process.env.CRON_SECRET_KEY;
class PaymentController {
    static GetPaymentDetailsForKid = asyncHandler(async (req, res) => {
        const parent = await Parent.findById(req.user);
        if (!parent) {
            throw new UnauthorizedError("Unauthorized access");
        }
        const { kidId } = req.params;
        if (!kidId) {
            throw new BadRequestError("Kid ID is required");
        }
        const kidsWithChores = await PaymentService.getPaymentDetailsForKid(kidId);
        res.status(status_codes.HTTP_200_OK).json({
            status: 200,
            success: true,
            data: kidsWithChores,
        });
        return;
    });
    static InitiatePayment = asyncHandler(async (req, res) => {
        try {
            const parent = await Parent.findById(req.user);
            if (!parent) {
                throw new UnauthorizedError("Unauthorized access");
            }
            const { kidId } = req.body;
            const paymentIntent = await PaymentService.processStripePayment(kidId, parent._id);
            res.status(status_codes.HTTP_200_OK).json({
                status: 200,
                success: true,
                data: paymentIntent,
            });
            return;
        }
        catch (error) {
            console.error("Payment error:", error);
            res.status(status_codes.HTTP_400_BAD_REQUEST).json({
                success: false,
                message: error.message,
            });
            return;
        }
    });
    static StripeWebhookHandler = asyncHandler(async (req, res) => {
        const sig = req.headers["stripe-signature"];
        const rawBody = req.body;
        console.log("Received Stripe webhook. Signature:", sig);
        console.log("Raw body buffer length:", rawBody?.length);
        try {
            await PaymentService.handleStripeWebhook(sig, rawBody);
            res.status(200).json({ received: true });
        }
        catch (error) {
            console.error("Webhook Error:", error.message);
            res.status(400).send(`Webhook Error: ${error.message}`);
        }
    });
    static WithdrawFromWallet = asyncHandler(async (req, res) => {
        const kid = await Kid.findById(req.user);
        if (!kid) {
            throw new UnauthorizedError("Unauthorized access");
        }
        const result = await PaymentService.withdrawMoney(kid);
        res.status(status_codes.HTTP_200_OK).json({
            status: 200,
            success: true,
            data: result,
        });
        return;
    });
    static SchedulePayment = asyncHandler(async (req, res) => {
        const parent = await Parent.findById(req.user);
        if (!parent) {
            throw new UnauthorizedError("Unauthorized access");
        }
        const { scheduleType, startDate } = req.body;
        if (!scheduleType || !startDate) {
            throw new BadRequestError("All fields are required");
        }
        // Validate the start date format (YYYY-MM-DD)
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(startDate)) {
            throw new BadRequestError("Invalid start date format. Use YYYY-MM-DD.");
        }
        const start = new Date(startDate);
        const today = new Date();
        // Validate start date format
        if (isNaN(start.getTime())) {
            throw new BadRequestError("Invalid start date.");
        }
        // Compare only the calendar dates by resetting time
        start.setHours(0, 0, 0, 0);
        today.setHours(0, 0, 0, 0);
        if (start < today) {
            throw new BadRequestError("Start date cannot be in the past.");
        }
        const paymentSchedule = await PaymentService.createSchedule(parent._id, scheduleType, startDate);
        res.status(status_codes.HTTP_201_CREATED).json({
            success: true,
            data: paymentSchedule,
        });
        return;
    });
    static CheckOverduePayments = asyncHandler(async (req, res) => {
        if (req.headers["x-cron-secret"] !== CRON_SECRET) {
            console.warn("Unauthorized cron attempt");
            res.status(status_codes.HTTP_401_UNAUTHORIZED).json({ success: false });
            return;
        }
        try {
            await PaymentService.checkDuePayments();
            res.status(status_codes.HTTP_200_OK).json({
                success: true,
            });
            return;
        }
        catch (error) {
            console.error("Cron job failed:", error);
            res
                .status(status_codes.HTTP_500_INTERNAL_SERVER_ERROR)
                .json({ success: false, error: error.message });
            return;
        }
    });
}
export default PaymentController;
