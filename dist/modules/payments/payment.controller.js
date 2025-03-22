import { status_codes } from "../../utils/status_constants.js";
import PaymentService from "./payment.service.js";
import asyncHandler from "express-async-handler";
import { BadRequestError, UnauthorizedError, } from "../../models/errors.js";
import { User } from "../users/user.model.js";
class PaymentController {
    static GetKidsForPayment = asyncHandler(async (req, res) => {
        const parent = await User.findById(req.user);
        if (!parent) {
            throw new UnauthorizedError("Unauthorized access");
        }
        const kidsWithChores = await PaymentService.getKidsWithApprovedChores(parent._id);
        res.status(status_codes.HTTP_200_OK).json({
            status: 200,
            success: true,
            data: kidsWithChores,
        });
        return;
    });
    static InitiatePayment = asyncHandler(async (req, res) => {
        try {
            const parent = await User.findById(req.user);
            if (!parent) {
                throw new UnauthorizedError("Unauthorized access");
            }
            const { kidId, paymentMethodId } = req.body;
            const paymentIntent = await PaymentService.processPayment(kidId, parent._id, paymentMethodId);
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
    static SchedulePayment = asyncHandler(async (req, res) => {
        const parent = await User.findById(req.user);
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
        // Parse the start date
        const start = new Date(startDate);
        // Check if the date is valid
        if (isNaN(start.getTime())) {
            throw new BadRequestError("Invalid start date.");
        }
        // Check if the date is in the past
        const today = new Date();
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
        const result = await PaymentService.checkDuePayments();
        res.status(status_codes.HTTP_200_OK).json({
            success: true,
            data: result
        });
        return;
    });
}
export default PaymentController;
