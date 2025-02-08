const express = require("express");
const registerRouter = express.Router();
import authenticateUser from "../../middlewares/authentication/authware";
import { validateSignUpInputForParent, validateUserRequestPassword } from "../../middlewares/validators/validator";
import UserController from "./user.controller";
import otpLimiter from "../../middlewares/otpLimter"; 
import upload from "../../config/multer.config";
import authorizeParent from "../../middlewares/authentication/parentRoleWare";


registerRouter.post("/signup/parent", upload.single("profile-image"), validateSignUpInputForParent, UserController.registerParent)
registerRouter.post("/verify-email", UserController.verifyEmail)
registerRouter.post("/logout", authenticateUser, UserController.logout)
registerRouter.post("/login", UserController.login) 
registerRouter.post("/refresh-token", authenticateUser, UserController.refreshToken)
registerRouter.post("/forgot-password", UserController.forgotPassword)
registerRouter.post("/resend-otp", otpLimiter, UserController.resendOTP)
registerRouter.post("/reset-password/:token", validateUserRequestPassword, UserController.resetPassword)
registerRouter.post("/parent/child", upload.single("profile-image"), authorizeParent, validateUserRequestPassword, UserController.createKidProfile)

export default registerRouter