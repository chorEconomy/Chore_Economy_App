import authenticateUser from "../../middlewares/authentication/authware.js";
import authorizeParent from "../../middlewares/authentication/parentRoleWare.js";
import PaymentController from "./payment.controller.js";

import express from "express"
const paymentRouter = express.Router();

paymentRouter.get("/kids", authorizeParent, PaymentController.GetKidsForPayment)
paymentRouter.get("/check-due-payments", PaymentController.CheckOverduePayments)
paymentRouter.post("/initiate", authorizeParent, PaymentController.InitiatePayment)
paymentRouter.post("/schedule", authorizeParent, PaymentController.SchedulePayment)

export default paymentRouter