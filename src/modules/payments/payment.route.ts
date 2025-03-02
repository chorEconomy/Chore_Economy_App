import authenticateUser from "../../middlewares/authentication/authware";
import PaymentController from "./payment.controller";

const express = require("express")
const paymentRouter = express.Router();

paymentRouter.post("/create-payment-intent", authenticateUser, PaymentController.CreatePaymentIntent)


export default paymentRouter