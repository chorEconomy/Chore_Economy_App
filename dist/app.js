import express from "express";
import authRouter from "./modules/users/user.routes.js";
import choreRouter from "./modules/chores/chore.routes.js";
import expenseRouter from "./modules/expenses/expense.routes.js";
import paymentRouter from "./modules/payments/payment.route.js";
import { status_codes } from "./utils/status_constants.js";
import savingsRouter from "./modules/savings/saving.routes.js";
import walletRouter from "./modules/wallets/wallet.routes.js";
import { globalErrorHandler } from "./middlewares/global-error-middleware.js";
// import cors from "cors"
const app = express();
//==================MIDDLEWARES=================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
//====== routes for application========//
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
app.use("/api/v1/payments", paymentRouter);
app.use("/api/v1/wallets", walletRouter);

app.use("*", (req, res, next) => {
    res.status(status_codes.HTTP_404_NOT_FOUND).json({
        status: 404,
        success: false,
        message: `Can't find ${req.originalUrl} on the server!`
    });
});
app.use(globalErrorHandler);
export default app;
