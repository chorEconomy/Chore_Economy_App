const Stripe = require("stripe")
const dotenv = require("dotenv")
dotenv.config()

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

class PaymentService {
    static async createPaymentIntentService(amount: number, currency: string) {
        const paymentIntent = await stripe.paymentIntents.create({
            amount,
            currency,
            payment_method_types: ["card"],
        })
        
        return paymentIntent.client_secret
    }
}

export default PaymentService