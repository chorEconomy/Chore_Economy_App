import express from "express"
const choreRouter = express.Router();
import ChoreController from "./chore.controller.js";
import authorizeParent from "../../middlewares/authentication/parentRoleWare.js";
import upload from "../../config/multer.config.js";
import authorizeKid from "../../middlewares/authentication/childRoleWare.js";
import authenticateUser from "../../middlewares/authentication/authware.js";
import authorizeAdmin from "../../middlewares/authentication/adminRoleWare.js";

choreRouter.post("/", upload.single("chore-image"), authorizeParent, ChoreController.createChore);
choreRouter.get("", authenticateUser, ChoreController.fetchChoresByStatus)
choreRouter.patch("/:id/approve", authorizeParent, ChoreController.approveChore)
choreRouter.get("/statistics", authorizeAdmin, ChoreController.fetchChoreStatistics)        
choreRouter.get("/parent/:parentId", authorizeAdmin, ChoreController.fetchChoresByParentId)        
choreRouter.patch("/:id", authorizeKid, ChoreController.takeChore)
choreRouter.get("/:id", authenticateUser, ChoreController.fetchChore)
choreRouter.post("/:id/deny", authorizeParent, ChoreController.denyChore)
choreRouter.post("/:id/complete", upload.array("chore-image", 4), authorizeKid, ChoreController.completeChore)

export default choreRouter