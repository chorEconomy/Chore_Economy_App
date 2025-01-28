const express = require("express");
const registerRouter = express.Router();
import { validateSignUpInputForParent } from "../../middlewares/validators/validator";
import UserController from "./user.controller";

registerRouter.post("/signup/parent", validateSignUpInputForParent, UserController.registerParent)
registerRouter.post("/verify-email", UserController.verifyEmail)
registerRouter.post("/logout", UserController.logout)

export default registerRouter