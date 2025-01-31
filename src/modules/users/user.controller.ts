import { NextFunction, Request, Response } from "express";
import {registerParentService, verifyEmailService } from "./user.service";
import status_codes from "../../utils/status_constants";
import { check_if_user_exist_with_email, check_if_user_exist_with_id } from "../../utils/check_user_exists.utils";
import { User } from "./user.model";
import comparePassword from "../../utils/compare_password";
import { decode_token, encode_token } from "../../utils/token_management";
import RequestWithUser from "../../models/RequestWithUSer"; 
import { sendResetPasswordEmail } from "../../utils/email_sender.utils"; 
const bcrypt = require("bcrypt");


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
  
  static async logout(req: RequestWithUser, res: Response, next: NextFunction) {
    try {
        if (!req.headers || !req.headers.authorization) {
            return res.status(status_codes.HTTP_401_UNAUTHORIZED).json({
                success: false,
                message: 'Authorization failed!',
            });
        }

        const token = req.headers.authorization.split(' ')[1];
        if (!token) {
            return res.status(status_codes.HTTP_401_UNAUTHORIZED).json({
                success: false,
                message: 'No token provided!',
            });
        }

        if (!req.user || !req.user.tokens) {
            return res.status(status_codes.HTTP_400_BAD_REQUEST).json({
                success: false,
                message: "User session not found!",
            });
        }

        // Remove both the access and refresh tokens from the user's token array
        const updatedTokens = req.user.tokens.filter(
            (t: any) => t.access_token !== token && t.refresh_token !== token
        );

        await User.findByIdAndUpdate(req.user._id, { tokens: updatedTokens });

        res.status(status_codes.HTTP_200_OK).json({
            status: 200,
            success: true,
            message: "Logged out successfully",
        });
    } catch (error: any) {
        console.error("Logout error:", error);
        return res.status(status_codes.HTTP_500_INTERNAL_SERVER_ERROR).json({
            status: 500,
            success: false,
            message: error?.message || "An error occurred during logout",
        });
    }
}

  static async login(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.body) {
        return res.status(status_codes.HTTP_422_UNPROCESSABLE_ENTITY).json({
          status: 422,
          success: false,
          message: "Unprocessable request body",
        });
      }
  
      const user = await check_if_user_exist_with_email(req.body.email);
      if (!user) {
        return res.status(status_codes.HTTP_400_BAD_REQUEST).json({
          status: 400,
          success: false,
          message: "Invalid credentials!",
        });
      }
  
      const isPasswordValid = await comparePassword(req.body.password, user.password);
      if (!isPasswordValid) {
        return res.status(status_codes.HTTP_400_BAD_REQUEST).json({
          status: 400,
          success: false,
          message: "Invalid credentials!",
        });
      }
  
      // Generate access and refresh tokens
      const access_token = encode_token(user._id, '30m');
      const refresh_token = encode_token(user._id, '2d');
  
      // Get the existing tokens, if any
      let oldTokens = user.tokens || [];
  
      // Clean up expired tokens: remove access tokens older than 30 minutes and refresh tokens older than 3 days
      oldTokens = oldTokens.filter((token: any) => {
        const timeDifference = (Date.now() - parseInt(token.signedAt)) / 1000;
        if (token.access_token && timeDifference < 1800) {
          return true; // Keep access tokens within 30 minutes
        }
        if (token.refresh_token && timeDifference < 172800) {
          return true; // Keep refresh tokens within 3 days
        }
        return false; // Remove expired tokens
      });
  
      // Store both access and refresh tokens together
      await User.findByIdAndUpdate(user._id, {
        tokens: [
          ...oldTokens,
          { 
            access_token,
            refresh_token,
            signedAt: Date.now().toString(),
          },
        ],
      });
  
      // Update the user's last login time
      user.lastLogin = new Date();
      await user.save();
  
      // Send response with access and refresh tokens
      res.status(status_codes.HTTP_200_OK).json({
        success: true,
        access_token: access_token,
        refresh_token: refresh_token,
      });
    } catch (error) {
      console.error('Login error:', error);
      return res.status(status_codes.HTTP_500_INTERNAL_SERVER_ERROR).json({
        status: 500,
        success: false,
        message: "An error occurred during login",
      });
    }
  }  

  static async refreshToken(req: Request, res: Response, next: NextFunction) {
    try {
      const { refresh_token } = req.body;
  
      if (!refresh_token) {
        return res.status(status_codes.HTTP_422_UNPROCESSABLE_ENTITY).json({
          status: 422,
          message: "Refresh token is required",
        });
      }
  
      // Decode refresh token
      const userId = decode_token(refresh_token);
      if (!userId) {
        return res.status(status_codes.HTTP_401_UNAUTHORIZED).json({
          status: 401,
          message: "Invalid or expired refresh token",
        });
      }
  
      // Check if refresh token exists in the database
      const user = await User.findById(userId);
      if (!user || !user.tokens.some((t: any) => t.refresh_token === refresh_token)) {
        return res.status(status_codes.HTTP_401_UNAUTHORIZED).json({
          status: 401,
          message: "Invalid refresh token",
        });
      }
  
      // Generate new tokens
      const newAccessToken = encode_token(userId, "30m");
      const newRefreshToken = encode_token(userId, "7d");
  
      // Remove old refresh token & store new ones
      user.tokens = user.tokens.filter((t: any) => t.refresh_token !== refresh_token);

      user.tokens.push({
        access_token: newAccessToken,
        refresh_token: newRefreshToken,
        signedAt: Date.now().toString(),
      });
  
      await user.save();
  
      res.status(status_codes.HTTP_200_OK).json({
        status: 200,
        access_token: newAccessToken,
        refresh_token: newRefreshToken,
      });
    } catch (error) {
      console.error("Refresh token error:", error);
      return res.status(status_codes.HTTP_500_INTERNAL_SERVER_ERROR).json({
        status: 500,
        message: "Internal Server Error",
      });
    }
  }  

  static async forgotPassword(req: Request, res: Response, next: NextFunction) {
    try {
    if (!req.body) {
      return res.status(status_codes.HTTP_422_UNPROCESSABLE_ENTITY).json({
        status: 422,
        success: false,
        message: "Unprocessable request body",
      });
    }
    const { email } = req?.body
    const user = await check_if_user_exist_with_email(email)
    if (!user) {
      return res.status(status_codes.HTTP_404_NOT_FOUND).json({status: 404, message: "User not found"})
      }
      
      const resetToken = encode_token(user._id, "10m")
      console.log(resetToken);
      
      const resetPasswordLink = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;

    sendResetPasswordEmail(user.firstName, user.email, resetPasswordLink)
      
      res.status(status_codes.HTTP_200_OK).json({ success: true, status: 200, message: "Password reset link sent to your email." })
      
    } catch (error) {
      console.error("Forgot password error:", error);
      return res.status(status_codes.HTTP_500_INTERNAL_SERVER_ERROR).json({
        status: 500,
        success: false,
        message: "Internal Server Error",
      });
    }
  }

  static async resetPassword(req: Request, res: Response, next: NextFunction) { 
    try {
      if (!req.body) {
        return res.status(status_codes.HTTP_422_UNPROCESSABLE_ENTITY).json({
          status: 422,
          success: false,
          message: "Unprocessable request body",
        });
      }
      const { token } = req.params
      const { password } = req.body
      const userId = decode_token(token);
      if (!userId) {
        res.status(status_codes.HTTP_400_BAD_REQUEST).json({
          status: 400,
          success: false,
          message: "link has expired or token not valid",
        });
      }
      const user = await check_if_user_exist_with_id(userId);
      if (!user) {
        res
          .status(status_codes?.HTTP_404_NOT_FOUND)
          .json({ status: 404, message: "User not found" });
      }
 

      const salt = await bcrypt.genSalt(12); 
      const userPassword = await bcrypt.hash(password, salt);

      user.password = userPassword;

      await user.save()
      return res.status(status_codes.HTTP_200_OK).json({status: 200, success: true, message: "Password reset successful"})
    } catch (error) {
      console.error("Password reset error:", error);
      return res.status(status_codes.HTTP_500_INTERNAL_SERVER_ERROR).json({
        status: 500,
        success: false,
        message: "Internal Server Error",
      });
    }
  }
}




export default UserController;
