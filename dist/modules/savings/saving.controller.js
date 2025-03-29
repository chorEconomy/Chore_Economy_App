import { status_codes } from "../../utils/status_constants.js";
import SavingService from "./saving.service.js";
import { Kid } from "../users/user.model.js";
import asyncHandler from "express-async-handler";
import { BadRequestError, NotFoundError, UnauthorizedError, UnprocessableEntityError, } from "../../models/errors.js";
import dotenv from "dotenv";
dotenv.config();
const CRON_SECRET = process.env.CRON_SECRET_KEY;
class SavingController {
    static CreateSaving = asyncHandler(async (req, res) => {
        const kid = await Kid.findById(req.user);
        if (!kid) {
            throw new UnauthorizedError("Unauthorized access");
        }
        if (!req.body) {
            throw new UnprocessableEntityError("Unprocessable request body");
        }
        const saving = await SavingService.createSaving(req.body, kid._id);
        if (!saving) {
            throw new NotFoundError("Saving not found!");
        }
        res.status(status_codes.HTTP_201_CREATED).json({
            status: 201,
            success: true,
            message: "Saving created successfully.",
            data: saving,
        });
        return;
    });
    static FetchSaving = asyncHandler(async (req, res) => {
        const kid = await Kid.findById(req.user);
        if (!kid) {
            throw new UnauthorizedError("Unauthorized access");
        }
        const { id } = req.params;
        if (!id) {
            throw new BadRequestError("Please provide a valid id");
        }
        const saving = await SavingService.fetchSaving(id, kid._id);
        if (!saving) {
            throw new NotFoundError("Saving not found!");
        }
        res.status(status_codes.HTTP_200_OK).json({
            status: 200,
            success: true,
            message: "Saving fetched successfully.",
            data: saving,
        });
        return;
    });
    static DeleteSaving = asyncHandler(async (req, res) => {
        const kid = await Kid.findById(req.user);
        if (!kid) {
            throw new UnauthorizedError("Unauthorized access");
        }
        const { id } = req.params;
        if (!id) {
            throw new BadRequestError("Please provide a valid id");
        }
        const saving = await SavingService.deleteSaving(id, kid._id);
        if (!saving) {
            throw new NotFoundError("Saving not found!");
        }
        res.status(status_codes.HTTP_204_NO_CONTENT).json({
            status: 204,
            success: true,
            message: "Saving deleted successfully.",
        });
        return;
    });
    static MakePayment = asyncHandler(async (req, res) => {
        const kid = await Kid.findById(req.user);
        if (!kid) {
            throw new UnauthorizedError("Unauthorized access");
        }
        const { id } = req.params;
        const { amount, isScheduledPayment } = req.body;
        const result = await SavingService.addToSavings(kid._id, id, amount, isScheduledPayment);
        res.status(status_codes.HTTP_200_OK).json({
            status: 200,
            success: true,
            data: result
        });
        return;
    });
    static WithdrawFromSavings = asyncHandler(async (req, res) => {
        const kid = await Kid.findById(req.user);
        if (!kid) {
            throw new UnauthorizedError("Unauthorized access");
        }
        const { savingId } = req.body;
        const result = await SavingService.withdrawFromSavings(kid._id, savingId);
        res.status(status_codes.HTTP_200_OK).json({
            status: 200,
            success: true,
            data: result
        });
        return;
    });
    static GetSavingsHistory = asyncHandler(async (req, res) => {
        const kid = await Kid.findById(req.user);
        if (!kid) {
            throw new UnauthorizedError("Unauthorized access");
        }
        const { savingId } = req.params;
        const history = await SavingService.getSavingsHistory(kid._id, savingId);
        res.status(status_codes.HTTP_200_OK).json({
            status: 200,
            success: true,
            data: history
        });
        return;
    });
    static GetAllSavingsGoals = asyncHandler(async (req, res) => {
        const kid = await Kid.findById(req.user);
        if (!kid) {
            throw new UnauthorizedError("Unauthorized access");
        }
        const savings = await SavingService.getAllSavingsGoals(kid._id);
        console.log(savings)
        res.status(status_codes.HTTP_200_OK).json({
            status: 200,
            success: true,
            data: savings
        });
        return;
    });
    static TriggerSavingsReminders = asyncHandler(async (req, res) => {
        if (req.headers["x-cron-secret"] !== CRON_SECRET) {
            console.warn("Unauthorized cron attempt");
            res.status(status_codes.HTTP_401_UNAUTHORIZED).json({ success: false });
            return;
        }
        try {
            await SavingService.checkAndSendReminders();
            res.status(status_codes.HTTP_200_OK).json({ success: true });
            return;
        }
        catch (error) {
            console.error("Cron job failed:", error);
            res.status(status_codes.HTTP_500_INTERNAL_SERVER_ERROR).json({ success: false, error: error.message });
            return;
        }
    });
}
export default SavingController;
