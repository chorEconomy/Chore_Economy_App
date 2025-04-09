const OTP_RETRY_WINDOW_MINUTES = parseInt(process.env.OTP_RETRY_WINDOW_MINUTES || '2');
const OTP_EXPIRY_MINUTES = parseInt(process.env.OTP_EXPIRY_MINUTES || '5');

const generateOTP = (length: number = 5): string => {
    let otp = "";
    for (let i = 0; i < length; i++) {
        otp += Math.floor(Math.random() * 10).toString();
    }
    return otp;
};

const generateResetOtp = () => {
    return {
      otp: generateOTP(),
      expiresAt: new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000)
    };
  }

const checkOtpRateLimit = (user: any) => {
    const currentTime = new Date();
    const retryWindowMs = OTP_RETRY_WINDOW_MINUTES * 60 * 1000;
    
    if (user.lastOtpRequest) {
      const lastRequestTime = new Date(user.lastOtpRequest).getTime();
      if (currentTime.getTime() - lastRequestTime < retryWindowMs) {
        const remainingMinutes = Math.ceil(
          (retryWindowMs - (currentTime.getTime() - lastRequestTime)) / 60000
        );
        throw new Error(`Please wait ${remainingMinutes} minute(s) before requesting a new OTP`);
      }
    }
  }

export {generateOTP, generateResetOtp, checkOtpRateLimit}