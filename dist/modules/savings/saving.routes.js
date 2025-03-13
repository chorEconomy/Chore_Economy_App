import authorizeKid from "../../middlewares/authentication/childRoleWare.js";
import SavingController from "./saving.controller.js";
import express from "express";
const savingsRouter = express.Router();
savingsRouter.post("/", authorizeKid, SavingController.CreateSaving);
savingsRouter.get("/:id", authorizeKid, SavingController.FetchSaving);
savingsRouter.get("/", authorizeKid, SavingController.FetchAllSavings);
savingsRouter.delete("/:id", authorizeKid, SavingController.DeleteSaving);
export default savingsRouter;
