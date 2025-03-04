import { status_codes } from "../../utils/status_constants.js";
import PaymentService from "./payment.service.js";
class PaymentController {
    static async CreatePaymentIntent(req, res) {
        try {
            if (!req.user) {
                res.status(status_codes.HTTP_401_UNAUTHORIZED).json({
                    status: 401,
                    success: false,
                    message: "Unauthorized access",
                });
                return;
            }
            if (!req.body) {
                res.status(status_codes.HTTP_422_UNPROCESSABLE_ENTITY).json({
                    status: 422,
                    success: false,
                    message: "Unproccessible entity",
                });
                return;
            }
            const { amount, currency } = req.body;
            const client_secret_key = await PaymentService.createPaymentIntentService(amount, currency);
            res.status(status_codes.HTTP_201_CREATED).json({
                status: 201,
                success: true,
                message: "Payment Intent Created Successfully.",
                data: client_secret_key
            });
            return;
        }
        catch (error) {
            res.status(status_codes.HTTP_500_INTERNAL_SERVER_ERROR).json({
                status: 500,
                success: false,
                message: "Internal server error",
                error: error?.message || 'An unexpected error occurred.',
            });
            return;
        }
    }
}
export default PaymentController;
