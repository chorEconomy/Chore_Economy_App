import authorizeKid from "../../middlewares/authentication/childRoleWare.js";
import WalletController from "./wallet.controller.js";
import express from "express";
const walletRouter = express.Router();
walletRouter.get("/kid", authorizeKid, WalletController.fetchWallet);
export default walletRouter;
