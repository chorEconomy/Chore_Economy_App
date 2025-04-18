import authorizeKid from "../../middlewares/authentication/childRoleWare.js";
import SavingController from "./saving.controller.js";
import express from "express"
const savingsRouter = express.Router();

savingsRouter.post("/", authorizeKid, SavingController.CreateSaving);
savingsRouter.get("/:id", authorizeKid, SavingController.FetchSaving); 
savingsRouter.delete("/:id", authorizeKid, SavingController.DeleteSaving);
savingsRouter.post("/:id/pay", authorizeKid, SavingController.MakePayment);

savingsRouter.get("/:id/history", authorizeKid, SavingController.GetSavingsHistory);
savingsRouter.get("/", authorizeKid, SavingController.GetAllSavingsGoals);
savingsRouter.get("/savings-reminders", SavingController.TriggerSavingsReminders);
savingsRouter.patch("/:id/withdraw", authorizeKid, SavingController.WithdrawCompletedSaving);



export default savingsRouter