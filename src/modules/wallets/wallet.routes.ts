import authenticateUser from "../../middlewares/authentication/authware.js";
import WalletController from "./wallet.controller.js";
import express from "express"
const walletRouter = express.Router();

walletRouter.get("/kids/:kidId", authenticateUser, WalletController.fetchWallet);

export default walletRouter