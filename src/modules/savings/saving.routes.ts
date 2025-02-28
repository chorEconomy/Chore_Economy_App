import authorizeKid from "../../middlewares/authentication/childRoleWare";
import SavingController from "./saving.controller";

const express = require("express");
const savingsRouter = express.Router();

savingsRouter.post("/", authorizeKid, SavingController.CreateSaving)
savingsRouter.get("/:id", authorizeKid, SavingController.FetchSaving)
savingsRouter.get("/", authorizeKid, SavingController.FetchAllSavings)
savingsRouter.delete("/", authorizeKid, SavingController.DeleteSaving)

export default savingsRouter