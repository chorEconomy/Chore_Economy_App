const express = require("express");
const choreRouter = express.Router();
import ChoreController from "./chore.controller";
import authorizeParent from "../../middlewares/authentication/parentRoleWare";
import upload from "../../config/multer.config";

choreRouter.post("/", upload.single("chore-image"), authorizeParent, ChoreController.create)

export default choreRouter