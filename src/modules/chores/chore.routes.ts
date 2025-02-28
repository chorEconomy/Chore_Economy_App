const express = require("express");
const choreRouter = express.Router();
import ChoreController from "./chore.controller";
import authorizeParent from "../../middlewares/authentication/parentRoleWare";
import upload from "../../config/multer.config";
import authorizeKid from "../../middlewares/authentication/childRoleWare";
import authenticateUser from "../../middlewares/authentication/authware";

choreRouter.post("/", upload.single("chore-image"), authorizeParent, ChoreController.createChore)
choreRouter.get("/", authenticateUser, ChoreController.fetchAllChores)
choreRouter.get("", authenticateUser, ChoreController.fetchChoresByStatus)
choreRouter.get("/:id", authorizeParent, ChoreController.fetchChore)
choreRouter.get("/:id/approve", authorizeParent, ChoreController.approveChoreReward)
choreRouter.get("/:id", authorizeKid, ChoreController.takeChore)
choreRouter.post("/:id/deny", authorizeParent, ChoreController.approveChoreReward)
choreRouter.post(":id/complete", upload.array("chore-image"), authorizeKid, ChoreController.completeChore)

// choreRouter.get("/rejected", authorizeKid, ChoreController.fetchRejectedChores)
// choreRouter.get("/completed", authorizeParent, ChoreController.fetchCompletedChores)
// choreRouter.get("/kid/completed", authorizeKid, ChoreController.fetchCompletedChoresForKid)
// choreRouter.get("/unclaimed", authorizeParent, ChoreController.fetchUnclaimedChores)
// choreRouter.get("/inprogress", authorizeParent, ChoreController.fetchInProgressChores)
// choreRouter.get("/pending", authorizeKid, ChoreController.fetchPendingChoresForKid)

export default choreRouter