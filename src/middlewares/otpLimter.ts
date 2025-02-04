import rateLimit from "express-rate-limit";
import { Request } from "express";

const otpLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 1, // Only 1 OTP request per minute
    message: { error: "Please wait 1 minute before requesting a new OTP."},
    keyGenerator: (req: Request)=> req.body.email || req.ip, // Rate limit per email instead of IP
});
  
export default otpLimiter