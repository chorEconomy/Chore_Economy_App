import authenticateUser from "../../middlewares/authentication/authware.js";
import authorizeKid from "../../middlewares/authentication/childRoleWare.js";
import authorizeParent from "../../middlewares/authentication/parentRoleWare.js";
import PaymentController from "./payment.controller.js";

import express from "express"
const paymentRouter = express.Router();

paymentRouter.get("/kids", authorizeParent, PaymentController.GetKidsForPayment)
paymentRouter.get("/check-due-payments", PaymentController.CheckOverduePayments)
paymentRouter.post("/initiate", authorizeParent, PaymentController.InitiatePayment)
paymentRouter.post("/stripe-webhook", express.raw({type: 'application/json'}), PaymentController.StripeWebhookHandler)
paymentRouter.post("/schedule", authorizeParent, PaymentController.SchedulePayment)
paymentRouter.post("/withdraw", authorizeKid, PaymentController.WithdrawFromWallet);


export default paymentRouter