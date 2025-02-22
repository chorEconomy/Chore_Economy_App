const express = require("express");
const authRouter = express.Router();
import authenticateUser from "../../middlewares/authentication/authware";
import { validateAuthInputForKid, validateSignUpInputForParent, validateUserRequestPassword } from "../../middlewares/validators/validator";
import UserController from "./user.controller";
import otpLimiter from "../../middlewares/otpLimter"; 
import upload from "../../config/multer.config";
import authorizeParent from "../../middlewares/authentication/parentRoleWare";
import authorizeKid from "../../middlewares/authentication/childRoleWare";


authRouter.post("/signup/parent", upload.single("profile-image"), validateSignUpInputForParent, UserController.registerParent)
authRouter.post("/verify-email", UserController.verifyEmail)
authRouter.post("/logout", authenticateUser, UserController.logout)
authRouter.post("/login", UserController.login) 
authRouter.post("/refresh-token", authenticateUser, UserController.refreshToken)
authRouter.post("/forgot-password", UserController.forgotPassword)
authRouter.post("/resend-otp", otpLimiter, UserController.resendOTP)
authRouter.post("/reset-password", UserController.resetPassword)
authRouter.get("/parent/profile/:id", UserController.fetchParent)
authRouter.get("/kid/profile/:id", UserController.fetchKid)
authRouter.put("/parent/update", upload.single("profile-image"), authorizeParent, UserController.editProfile)
authRouter.post("/parent/kids", upload.single("profile-image"), authorizeParent, validateAuthInputForKid, UserController.createKidProfile)
authRouter.delete("/parent/kids/:id", authorizeParent, UserController.deleteKidProfile)
authRouter.delete("/parent", authorizeParent, UserController.deleteParentProfile)
authRouter.post("/kids/login", UserController.loginKid)

export default authRouter