const express = require("express");
const choreRouter = express.Router();
import ChoreController from "./chore.controller";
import authorizeParent from "../../middlewares/authentication/parentRoleWare";
import upload from "../../config/multer.config";

choreRouter.post("/", upload.single("chore-image"), authorizeParent, ChoreController.createChore)
choreRouter.get("/", authorizeParent, ChoreController.fetchAllChores)
choreRouter.get("/completed", authorizeParent, ChoreController.fetchCompletedChores)
choreRouter.get("/unclaimed", authorizeParent, ChoreController.fetchUnclaimedChores)
choreRouter.get("/inprogress", authorizeParent, ChoreController.fetchInProgressChores)

export default choreRouter