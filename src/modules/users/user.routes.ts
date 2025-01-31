const express = require("express");
const registerRouter = express.Router();
import authenticateUser from "../../middlewares/authentication/authware";
import { validateSignUpInputForParent, validateUserRequestPassword } from "../../middlewares/validators/validator";
import UserController from "./user.controller";

registerRouter.post("/signup/parent", validateSignUpInputForParent, UserController.registerParent)
registerRouter.post("/verify-email", UserController.verifyEmail)
registerRouter.post("/logout", authenticateUser, UserController.logout)
registerRouter.post("/login", UserController.login)
registerRouter.post("/login", UserController.login)
registerRouter.post("/refresh-token", authenticateUser, UserController.refreshToken)
registerRouter.post("/forgot-password", UserController.forgotPassword)
registerRouter.post("/reset-password/:token", validateUserRequestPassword, UserController.resetPassword)

export default registerRouter