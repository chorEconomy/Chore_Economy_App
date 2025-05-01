import authorizeKid from "../../middlewares/authentication/childRoleWare.js";
import SavingController from "./saving.controller.js";
import express from "express";
const savingsRouter = express.Router();
// 1. Static routes (no parameters) first
savingsRouter.get("/savings-reminders", SavingController.TriggerSavingsReminders); // Open access
// 2. Root path routes
savingsRouter.post("/", authorizeKid, SavingController.CreateSaving);
savingsRouter.get("/", authorizeKid, SavingController.GetAllSavingsGoals);
// 3. Parameterized routes
savingsRouter.get("/:id", authorizeKid, SavingController.FetchSaving);
savingsRouter.delete("/:id", authorizeKid, SavingController.DeleteSaving);
savingsRouter.post("/:id/pay", authorizeKid, SavingController.MakePayment);
savingsRouter.get("/:id/history", authorizeKid, SavingController.GetSavingsHistory);
savingsRouter.patch("/:id/withdraw", authorizeKid, SavingController.WithdrawCompletedSaving);
export default savingsRouter;
