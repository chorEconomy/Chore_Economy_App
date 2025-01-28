import { NextFunction, Request, Response } from "express";
import { registerParentService, verifyEmailService } from "./user.service";
import status_codes from "../../utils/status_constants";
import { check_if_user_exist_with_email } from "../../utils/check_user_exists.utils";
import { User } from "./user.model";

class UserController {
  static async registerParent(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.body) {
        return res
          .status(status_codes.HTTP_422_UNPROCESSABLE_ENTITY)
          .json({ status: 422,  success: false, message: "unprocessible request body" });
      }

      const userAlreadyExists = await check_if_user_exist_with_email(
        req?.body?.email
      );
      if (userAlreadyExists) {
        return res.status(status_codes?.HTTP_409_CONFLICT).json({
          status: 409,
          success: false,
          message: "User with this email already exist!",
        });
      }

      const user = await registerParentService(req?.body, res);
        
      return res.status(status_codes.HTTP_201_CREATED).json({
        status: 201,
        success: true,
        message: "User created successfully",
        user: {
          ...user._doc,
          password: undefined,
        },
      });
        
    } catch (error: any) {
      return res.json({
        status: status_codes.HTTP_500_INTERNAL_SERVER_ERROR,
        success: false,
        message: error?.message,
      });
    }
  }

  static async verifyEmail(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.body) {
        return res
          .status(status_codes.HTTP_422_UNPROCESSABLE_ENTITY)
          .json({ status: 422, success: false, message: "unprocessible request body" });
      }

      if (!req.body.otp) {
        return res
        .status(status_codes.HTTP_400_BAD_REQUEST)
        .json({ status: 400, success: false, message: "OTP is required!" });
      }

      const response = await verifyEmailService(req?.body?.otp)

      if (response) {
        return res.status(status_codes.HTTP_400_BAD_REQUEST).json({status: 400, success: false, message: response})
      }

      return res
      .status(status_codes.HTTP_200_OK)
        .json({ status: 200, success: true, message: "Email verified successfully!"});
      
    } catch (error: any) {
      return res.json({
        status: status_codes.HTTP_500_INTERNAL_SERVER_ERROR,
        success: false,
        message: error?.message,
      });
    }
  }
  
  static async logout(req: Request, res: Response, next: NextFunction) {
    try {
      res.clearCookie("token")
      res.status(status_codes.HTTP_200_OK).json({ status: 200, success: true, message: "Logged out successfully" })
    } catch (error: any) {
      return res.json({
        status: status_codes.HTTP_500_INTERNAL_SERVER_ERROR,
        success: false,
        message: error?.message,
      });
    }
  }
  
}

export default UserController;
