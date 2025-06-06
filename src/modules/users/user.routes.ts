import express from "express"
const authRouter = express.Router();
import authenticateUser from "../../middlewares/authentication/authware.js";
import { validateSignUpInputForParent, validateAuthInputForKid } from "../../middlewares/validators/validator.js";
import UserController from "./user.controller.js";
import otpLimiter from "../../middlewares/otpLimter.js";
import upload from "../../config/multer.config.js";
import authorizeParent from "../../middlewares/authentication/parentRoleWare.js";
import authorizeAdmin from "../../middlewares/authentication/adminRoleWare.js";


authRouter.post("/signup/parent", upload.single("profile-image"), validateSignUpInputForParent, UserController.registerParent)
authRouter.post("/verify-registration", UserController.verifyRegistration)
authRouter.post("/verify-password-reset", UserController.verifyPasswordReset)
authRouter.post("/logout", authenticateUser, UserController.logout)
authRouter.post("/login", UserController.parentLogin) 
authRouter.post("/register-biometric", UserController.registerBiometricKey) 
authRouter.post("/verify-biometric", UserController.VerifyBiometricKey) 
authRouter.post("/refresh-token", UserController.refreshToken)
authRouter.post("/forgot-password", UserController.forgotPassword)
authRouter.post("/resend-otp", otpLimiter, UserController.resendOTP)
authRouter.post("/reset-password", UserController.resetPassword)
authRouter.get("/parent/profile/:id", UserController.fetchParent)
authRouter.get("/kid/profile/:id", authenticateUser, UserController.fetchKid)
authRouter.get("/kids", authorizeParent, UserController.fetchKidsForSingleParent)
authRouter.put("/parent/update", upload.single("profile-image"), authorizeParent, UserController.editProfile)
authRouter.post("/parent/kids", upload.single("profile-image"), authorizeParent, validateAuthInputForKid, UserController.createKidProfile)
authRouter.delete("/parent/kids/:id", authorizeParent, UserController.deleteKidProfile)
authRouter.delete("/parent", authorizeParent, UserController.deleteParentProfile)
authRouter.post("/kids/login", UserController.loginKid)
authRouter.post("/admin", UserController.registerAdmin)
authRouter.post("/admin/login", UserController.loginAdmin)
authRouter.get("/admin/users/count", authorizeAdmin, UserController.fetchTotalUsers)
authRouter.get("/admin/kids/count", authorizeAdmin, UserController.fetchTotalNumberOfKids)
authRouter.get("/admin/parents/count", authorizeAdmin, UserController.fetchTotalParents)
authRouter.get("/admin/gender-statistics", authorizeAdmin, UserController.fetchGenderStatistics)
authRouter.get("/admin/parents", authorizeAdmin, UserController.fetchParents)
authRouter.get("/admin/kids/:parentId", authorizeAdmin, UserController.fetchKidsForParent)

export default authRouter