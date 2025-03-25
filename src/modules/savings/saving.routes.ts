import authorizeKid from "../../middlewares/authentication/childRoleWare.js";
import SavingController from "./saving.controller.js";
import express from "express"
const savingsRouter = express.Router();

savingsRouter.post("/", authorizeKid, SavingController.CreateSaving);
savingsRouter.get("/:id", authorizeKid, SavingController.FetchSaving);
savingsRouter.get("/", authorizeKid, SavingController.FetchAllSavings);
savingsRouter.delete("/:id", authorizeKid, SavingController.DeleteSaving);

savingsRouter.post("/pay", authorizeKid, SavingController.MakePayment);
savingsRouter.post("/topup", authorizeKid, SavingController.TopUpSavings);
savingsRouter.post("/withdraw", authorizeKid, SavingController.WithdrawFromSavings);
savingsRouter.get("/", authorizeKid, SavingController.GetSavingsGoals);
savingsRouter.get("/:savingId/history", authorizeKid, SavingController.GetPaymentHistory);

export default savingsRouter