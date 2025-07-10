import express from "express";
import cors from "cors";
import authRouter from "./modules/users/user.routes.js";
import choreRouter from "./modules/chores/chore.routes.js";
import expenseRouter from "./modules/expenses/expense.routes.js";
import paymentRouter from "./modules/payments/payment.route.js";
import { status_codes } from "./utils/status_constants.js";
import savingsRouter from "./modules/savings/saving.routes.js";
import walletRouter from "./modules/wallets/wallet.routes.js";
import notificationRouter from "./modules/notifications/notification.routes.js";
import { globalErrorHandler } from "./middlewares/global-error-middleware.js";
const app = express();
// ================== CORS ==================
app.use(cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));
// ================== STRIPE WEBHOOK ROUTE BEFORE express.json() ==================
import bodyParser from "body-parser";
import stripeWebhookRouter from "./modules/payments/stripe-webhook.route.js"; // <- separate route for stripe
app.use("/api/v1/payments/stripe-webhook", bodyParser.raw({ type: "application/json" }), // Use raw body ONLY for this route
stripeWebhookRouter);
// ================== REST OF BODY PARSING ==================
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
// ================== ROUTES ==================
app.get("/api/v1/home", (req, res) => {
    res.status(status_codes.HTTP_200_OK).json({
        message: "Welcome to Chore Economy!!",
        status: 200,
    });
});
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/chores", choreRouter);
app.use("/api/v1/expenses", expenseRouter);
app.use("/api/v1/savings", savingsRouter);
app.use("/api/v1/payments", paymentRouter); // NOTE: this is for *other* payment routes
app.use("/api/v1/wallets", walletRouter);
app.use("/api/v1/notifications", notificationRouter);
// ================== 404 & ERROR HANDLING ==================
app.use("*", (req, res) => {
    res.status(status_codes.HTTP_404_NOT_FOUND).json({
        status: 404,
        success: false,
        message: `Can't find ${req.originalUrl} on the server!`
    });
});
app.use(globalErrorHandler);
export default app;
