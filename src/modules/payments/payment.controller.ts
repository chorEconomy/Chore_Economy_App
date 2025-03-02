import { Request, Response } from "express";
import AuthenticatedRequest from "../../models/AuthenticatedUser";
import status_codes from "../../utils/status_constants";
import PaymentService from "./payment.service";

class PaymentController {
    static async CreatePaymentIntent(req: AuthenticatedRequest, res: Response) {
        try {
            if (!req.user) {
                return res.status(status_codes.HTTP_401_UNAUTHORIZED).json({
                    status: 401,
                    success: false,
                    message: "Unauthorized access",
                  });
            }

            if (!req.body) {
                return res.status(status_codes.HTTP_422_UNPROCESSABLE_ENTITY).json({
                    status: 422,
                    success: false,
                    message: "Unproccessible entity",
                  });
            }

            const { amount, currency } = req.body
            
            const client_secret_key = await PaymentService.createPaymentIntentService(amount, currency)

            return res.status(status_codes.HTTP_201_CREATED).json({
                status: 201,
                success: true,
                message: "Payment Intent Created Successfully.",
                data: client_secret_key
            })

        } catch (error: any) {
            return res.status(status_codes.HTTP_500_INTERNAL_SERVER_ERROR).json({
                status: 500,
                success: false,
                message: "Internal server error",
                error: error?.message || 'An unexpected error occurred.',
              });
        }
    }
}

export default PaymentController