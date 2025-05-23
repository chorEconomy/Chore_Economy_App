import express from "express"
import { NextFunction, Request, Response } from "express"; 
import authRouter from "./modules/users/user.routes.js";
import choreRouter from "./modules/chores/chore.routes.js";
import expenseRouter from "./modules/expenses/expense.routes.js";
import paymentRouter from "./modules/payments/payment.route.js";
import {status_codes} from "./utils/status_constants.js";
import savingsRouter from "./modules/savings/saving.routes.js";
import walletRouter from "./modules/wallets/wallet.routes.js";
import notificationRouter from "./modules/notifications/notification.routes.js";
import { globalErrorHandler } from "./middlewares/global-error-middleware.js";
import cors from "cors";

const app = express();

//==================MIDDLEWARES=================
// Configure CORS to accept requests from any domain
app.use(cors({
  origin: "*", // Allow all origins
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE"], // Allowed methods
  allowedHeaders: ["Content-Type", "Authorization"] // Allowed headers
}));

app.use(express.json({
  verify: (req: any, res: Response, buf) => {
    if (req.originalUrl.startsWith('/api/v1/payments/stripe-webhook')) {
      req.rawBody = buf.toString('utf8');
    }
  }
}));
app.use(express.urlencoded({ extended: true }));

//====== routes for application========//
app.get("/api/v1/home", (req: Request, res: Response) => {
    res.status(status_codes.HTTP_200_OK).json({
      message: "Welcome to Chore Economy!!",
      status: 200,
    });
});

app.use("/api/v1/auth", authRouter)
app.use("/api/v1/chores", choreRouter)
app.use("/api/v1/expenses", expenseRouter)
app.use("/api/v1/savings", savingsRouter)
app.use("/api/v1/payments", paymentRouter)
app.use("/api/v1/wallets", walletRouter)
app.use("/api/v1/notifications", notificationRouter)

app.use("*", (req: Request, res: Response, next: NextFunction) => {
 res.status(status_codes.HTTP_404_NOT_FOUND).json({
    status: 404,
    success: false,
    message: `Can't find ${req.originalUrl} on the server!`
  });
});

app.use(globalErrorHandler)

export default app