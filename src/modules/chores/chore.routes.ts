const express = require("express");
const choreRouter = express.Router();
import ChoreController from "./chore.controller";
import authorizeParent from "../../middlewares/authentication/parentRoleWare";
import upload from "../../config/multer.config";
import authorizeKid from "../../middlewares/authentication/childRoleWare";

choreRouter.post("/", upload.single("chore-image"), authorizeParent, ChoreController.createChore)
choreRouter.get("/", authorizeParent, ChoreController.fetchAllChores)
choreRouter.get("/completed", authorizeParent, ChoreController.fetchCompletedChores)
choreRouter.get("/unclaimed", authorizeParent, ChoreController.fetchUnclaimedChores)
choreRouter.get("/inprogress", authorizeParent, ChoreController.fetchInProgressChores)
choreRouter.get("/:id", authorizeParent, ChoreController.fetchChore)
choreRouter.get("/:id/approve", authorizeParent, ChoreController.approveChoreReward)
choreRouter.get("/:id", authorizeKid, ChoreController.takeChore)
choreRouter.get("/", authorizeKid, ChoreController.fetchAllChoresForKid)
choreRouter.post("/:id/deny", authorizeParent, ChoreController.approveChoreReward)
choreRouter.get("/rejected", authorizeKid, ChoreController.fetchRejectedChores)
choreRouter.post(":id/complete", upload.array("chore-image"), authorizeKid, ChoreController.completeChore)

export default choreRouter