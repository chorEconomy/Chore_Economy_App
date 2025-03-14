import express from "express";
const choreRouter = express.Router();
import ChoreController from "./chore.controller.js";
import authorizeParent from "../../middlewares/authentication/parentRoleWare.js";
import upload from "../../config/multer.config.js";
import authorizeKid from "../../middlewares/authentication/childRoleWare.js";
import authenticateUser from "../../middlewares/authentication/authware.js";

choreRouter.post("/", upload.single("chore-image"), authorizeParent, ChoreController.createChore);
choreRouter.get("", authenticateUser, ChoreController.fetchChoresByStatus);
choreRouter.get("/:id", authenticateUser, ChoreController.fetchChore);
choreRouter.patch("/:id/approve", authorizeParent, ChoreController.approveChore);
choreRouter.patch("/:id", authorizeKid, ChoreController.takeChore);
choreRouter.post("/:id/deny", authorizeParent, ChoreController.denyChore);
choreRouter.post("/:id/complete", upload.array("chore-image"), authorizeKid, ChoreController.completeChore);
export default choreRouter;
