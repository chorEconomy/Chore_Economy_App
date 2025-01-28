import { check_if_user_exist_with_email } from "../../utils/check_user_exists.utils";
import { Response } from "express";
import generateOTP from "../../utils/otp.utils"; 
import { OTPInput, RegisterInputForParent } from "./user.types";
import { ERole, User, EGender, IUser } from "./user.model";
import { generateTokenAndSetCookie } from "../../utils/generateTokenAndSetCookie";
import { sendVerificationEmail, sendWelcomeEmail } from "../../utils/email_sender.utils";

const registerParentService = async (
    reqBody: RegisterInputForParent,
    res: Response
) => {
    const {
        first_name,
        last_name,
        email,
        password,
        gender,
        country,
        phone_number,
        role,
    } = reqBody;

    const verificationToken = generateOTP();

    const newUser: any = new User({
        firstName: first_name,
        lastName: last_name,
        fullName: `${first_name} ${last_name}`,
        email: email,
        country: country,
        password: password,
        gender: gender?.toLowerCase() as EGender,
        verificationToken,
        verificationTokenExpiresAt: Date.now() + 60 * 1000,
        phoneNumber: phone_number,
        role: role?.toLowerCase() as ERole,
        emailVerified: false,
    });

    await newUser.save();

    generateTokenAndSetCookie(res, newUser._id);

    await sendVerificationEmail(
        newUser.email,
        newUser.firstName,
        verificationToken
    );

    return newUser;
};

const verifyEmailService = async (otp: OTPInput) => {
  try {
    const user: any = await User.findOne({
        verificationToken: otp,
        verificationTokenExpiresAt: { $gt: Date.now() }
    });

    if (!user) {
        return "Invalid or expired OTP";
    }

    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpiresAt = undefined;

    await user.save()

    await sendWelcomeEmail(user.firstName, user.email);

    return;
      
  } catch (error: any) {
    throw new Error(error.message || "An error occurred during email verification");
  }
}

export { registerParentService, verifyEmailService};
