import express from "express";
import PaymentController from "./payment.controller.js";

const router = express.Router();

router.post("/", PaymentController.StripeWebhookHandler)

export default router;