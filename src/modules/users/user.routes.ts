import express from "express"
const authRouter = express.Router();
import authenticateUser from "../../middlewares/authentication/authware.js";
import { validateSignUpInputForParent, validateAuthInputForKid } from "../../middlewares/validators/validator.js";
import UserController from "./user.controller.js";
import otpLimiter from "../../middlewares/otpLimter.js";
import upload from "../../config/multer.config.js";
import authorizeParent from "../../middlewares/authentication/parentRoleWare.js";
import authorizeKid from "../../middlewares/authentication/childRoleWare.js";


authRouter.post("/signup/parent", upload.single("profile-image"), validateSignUpInputForParent, UserController.registerParent)
authRouter.post("/verify-email", UserController.verifyEmail)
authRouter.post("/logout", authenticateUser, UserController.logout)
authRouter.post("/login", UserController.login) 
authRouter.post("/refresh-token", UserController.refreshToken)
authRouter.post("/forgot-password", UserController.forgotPassword)
authRouter.post("/resend-otp", otpLimiter, UserController.resendOTP)
authRouter.post("/reset-password", UserController.resetPassword)
authRouter.get("/parent/profile/:id", UserController.fetchParent)
authRouter.get("/kid/profile/:id", UserController.fetchKid)
authRouter.get("/kids", authorizeParent, UserController.fetchKidsForSingleParent)
authRouter.put("/parent/update", upload.single("profile-image"), authorizeParent, UserController.editProfile)
authRouter.post("/parent/kids", upload.single("profile-image"), authorizeParent, validateAuthInputForKid, UserController.createKidProfile)
authRouter.delete("/parent/kids/:id", authorizeParent, UserController.deleteKidProfile)
authRouter.delete("/parent", authorizeParent, UserController.deleteParentProfile)
authRouter.post("/kids/login", UserController.loginKid)

export default authRouter