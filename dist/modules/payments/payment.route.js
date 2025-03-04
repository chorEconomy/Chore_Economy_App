import authenticateUser from "../../middlewares/authentication/authware.js";
import PaymentController from "./payment.controller.js";
import express from "express";
const paymentRouter = express.Router();
paymentRouter.post("/create-payment-intent", authenticateUser, PaymentController.CreatePaymentIntent);
export default paymentRouter;
