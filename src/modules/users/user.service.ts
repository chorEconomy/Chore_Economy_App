import { check_if_user_exist_with_email, check_if_user_exist_with_id, getUserByEmailAndRole } from "../../utils/check_user_exists.utils";
import { Response, Request } from "express";
import generateOTP from "../../utils/otp.utils"; 
import { OTPInput, RegisterInputForParent } from "./user.types";
import { Kid, User } from "./user.model";
import { sendResetPasswordEmail, sendVerificationEmail, sendWelcomeEmail } from "../../utils/email_sender.utils";
import { EGender, ERole } from "../../models/enums";
import status_codes from "../../utils/status_constants";
import { decode_token, generate_reset_token, generateTokens, verifyRefreshTokenAndIssueNewAccessToken } from "../../utils/token_management";
import RefreshToken from "./refresh.token.model";
import comparePassword from "../../utils/compare_password"; 
import CustomRequest from "../../models/CustomRequest";
import { uploadSingleFile } from "../../utils/file_upload.utils";
import AuthenticatedRequest from "../../models/AuthenticatedUser"; 
const bcrypt = require("bcrypt");

class AuthService {
  static async register(
    reqBody: RegisterInputForParent,
    imageUrl: string | null
  ) {
    const {
      first_name,
      last_name,
      email,
      password,
      gender,
      country,
      phone_number,
    } = reqBody;

    const verificationToken = generateOTP();

    const newUser = new User({
      firstName: first_name,
      lastName: last_name,
      fullName: `${first_name} ${last_name}`,
      email,
      country,
      password,
      gender: gender?.toLowerCase() as EGender,
      verificationToken,
      verificationTokenExpiresAt: Date.now() + 5 * 60 * 1000, // 5 minutes expiration
      phoneNumber: phone_number,
      role: ERole.Parent,
      photo: imageUrl,
      emailVerified: false,
    });

    await newUser.save();

    await sendVerificationEmail(newUser.email, newUser.firstName, verificationToken);

    return newUser;
  }
    static async RegisterParent(req: CustomRequest, res: Response) {
      try {
        if (!req.body) {
          return res.status(status_codes.HTTP_422_UNPROCESSABLE_ENTITY).json({
            status: 422,
            success: false,
            message: "Unprocessable request body",
          });
        }
    
        // Check if user already exists
        const userAlreadyExists = await check_if_user_exist_with_email(req.body.email);
        if (userAlreadyExists) {
          return res.status(status_codes.HTTP_409_CONFLICT).json({
            status: 409,
            success: false,
            message: "User with this email already exists!",
          });
        }
    
        // Upload image if provided
        let imageUrl: string | null = null;
        if (req.file) {
          const result = await uploadSingleFile(req.file);
          imageUrl = result?.secure_url || null;
        }
    
        // Register the user
        const user = await AuthService.register(req.body, imageUrl);
    
        return res.status(status_codes.HTTP_201_CREATED).json({
          status: 201,
          success: true,
          message: "User created successfully",
          user: {
            ...user.toObject(),
            password: undefined, // Exclude password from response
          },
        });
      } catch (error: any) {
        console.error("Error in RegisterParent:", error);
        return res.status(status_codes.HTTP_500_INTERNAL_SERVER_ERROR).json({
          status: 500,
          success: false,
          message: "Internal server error",
          error: error?.message,
        });
      }
    }
    
    static async verifyEmail(otp: OTPInput) {
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

    static async VerifyEmail(req: Request, res: Response) {
        try {
            if (!req.body) {
                return res.status(status_codes.HTTP_422_UNPROCESSABLE_ENTITY).json({
                    status: 422,
                    success: false,
                    message: "Unprocessable request body",
                });
            }
    
            if (!req.body.otp) {
                return res.status(status_codes.HTTP_400_BAD_REQUEST).json({
                    status: 400,
                    success: false,
                    message: "OTP is required!",
                });
            }
    
            const response = await AuthService.verifyEmail(req?.body?.otp);
            if (response) {
                return res.status(status_codes.HTTP_400_BAD_REQUEST).json({
                    status: 400,
                    success: false,
                    message: response,
                });
            }
    
            // Retrieve the user based on the OTP verification
            const user = await check_if_user_exist_with_email(req.body.email);
            if (!user) {
                return res.status(status_codes.HTTP_400_BAD_REQUEST).json({
                    status: 400,
                    success: false,
                    message: "User not found!",
                });
            }
    
            // Mark the user as verified
            user.isVerified = true;
            await user.save();
    
            // Use the helper function to generate and store tokens
            const { access_token, refresh_token } = await generateTokens(user);
    
            return res.status(status_codes.HTTP_200_OK).json({
                status: 200,
                success: true,
                message: "Email verified successfully! User logged in.",
                access_token,
                refresh_token,
            });
    
        } catch (error: any) {
            console.error('Verify Email error:', error);
            return res.status(status_codes.HTTP_500_INTERNAL_SERVER_ERROR).json({
                status: 500,
                success: false,
                message: error?.message,
            });
        }
    }

    static async RefreshToken(req: Request, res: Response) {
        try {
          const {refresh_token} = req.body;
    
          if (!refresh_token) {
            return res.status(status_codes.HTTP_422_UNPROCESSABLE_ENTITY).json({
              status: 422,
              message: "Refresh token is required",
            });
          }
    
          try {
            const { newAccessToken, newRefreshToken } = await verifyRefreshTokenAndIssueNewAccessToken(refresh_token);
    
            return res.status(status_codes.HTTP_200_OK).json({
              status: 200,
              access_token: newAccessToken,
              refresh_token: newRefreshToken,
            });
    
          } catch (error: any) {
            if (error instanceof Error && error.message === "Invalid or expired refresh token") {
              return res.status(status_codes.HTTP_403_FORBIDDEN).json({
                status: 403,
                message: "Invalid or expired refresh token",
              });
            }
            console.error("Refresh token verification error:", error);
            return res.status(status_codes.HTTP_500_INTERNAL_SERVER_ERROR).json({
              status: 500,
              message: "Internal Server Error",
            });
          }
    
        } catch (error) {
          console.error("Unexpected error in refreshToken:", error);
          return res.status(status_codes.HTTP_500_INTERNAL_SERVER_ERROR).json({
            status: 500,
            message: "Internal Server Error",
          });
        }
    }

    static async ResendOTP(req: Request, res: Response) { 
     try {
        const {email} = req.body
        if (!email) {
            return res.status(status_codes.HTTP_400_BAD_REQUEST).json({status: 400, message: "Email is required"})
        }

         const user = await check_if_user_exist_with_email(email)
         
         if (!user) {
            return res.status(status_codes.HTTP_404_NOT_FOUND).json({status: 404, message: "User with this email not found!"})
         }

        const verificationToken = generateOTP();

        user.verificationToken = verificationToken
        user.verificationTokenExpiresAt = Date.now() + 5 * 60 * 1000

         await user.save()
         
         await sendVerificationEmail(
            user.email,
            user.firstName,
            verificationToken
         );
         
         return res.status(status_codes.HTTP_200_OK).json({status: 200, success: true, message: "OTP resent successfully."})
     } catch (error) { 
        return res.status(500).json({ status: 500, message: "Internal Server Error" });
     }
    }

    static async Login(req: Request, res: Response) {
        try {
            if (!req.body) {
                return res.status(status_codes.HTTP_422_UNPROCESSABLE_ENTITY).json({
                    status: 422,
                    success: false,
                    message: "Unprocessable request body",
                });
          }
      
          const role = req.query.role as string;
          if (!role) {
            return res.status(status_codes.HTTP_400_BAD_REQUEST).json({
              status: 400,
              success: false,
              message: "Please provide a valid user's role",
          }); 
          }
      
          const user = await getUserByEmailAndRole(req.body.email, role);
          
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
          const { access_token, refresh_token } = await generateTokens(user);
          
            return res.status(status_codes.HTTP_200_OK).json({
                success: true,
                access_token,
                refresh_token,
                role: user.role
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

    static async Logout(req: Request, res: Response) {
      try {
        const { refresh_token } = req.body;

        if (!refresh_token) {
            return res.status(400).json({ status: 400, message: "Refresh token is required" });
        }
        
        const deletedToken = await RefreshToken.findOneAndDelete({ refreshToken: refresh_token });

        if (!deletedToken) {
            return res.status(404).json({ status: 404, message: "Refresh token not found" });
        }

        return res.status(200).json({ status: 200, message: "Logged out successfully" });
      } catch (error) {
        console.error("Logout error:", error);
        return res.status(500).json({ status: 500, message: "Internal Server Error" });
      }
    }

    static async ForgotPassword(req: Request, res: Response) {
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
              
              const reset_token = await generate_reset_token(user);
              
              console.log(reset_token);
              
              const resetPasswordLink = `${process.env.CLIENT_URL}/reset-password/${reset_token}`;
        
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
    
    static async ResetPassword(req: Request, res: Response) {
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
            user.password = password;
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
  
  static async CreateKidProfile(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.body) {
        return res.status(status_codes.HTTP_422_UNPROCESSABLE_ENTITY).json({
          status: 422,
          success: false,
          message: "Unprocessable request body",
        });
      }

      if (!req.user) {
        return res.status(status_codes.HTTP_401_UNAUTHORIZED).json({
          status: 401,
          success: false,
          message: "Unauthorized access",
        });
      }
      console.log("Request Body:", req.body); // Debugging Request Body
      console.log("File Data:", req.file); // Debugging Uploaded File
      const { name, password } = req.body;
      
      console.log(name);
      console.log(password);
      const parentId = req.user;

      const existingKid = await Kid.findOne({ parentId, name })

      if (existingKid) {
        return res.status(status_codes.HTTP_400_BAD_REQUEST).json({status: 400, success: false, message: `Kid with this account name already exists under your account`})
      }

      const hashedPassword = await bcrypt.hash(password, 10); 

       // Upload image if provided
       let imageUrl: string | null = null;
       if (req.file) {
         const result = await uploadSingleFile(req.file);
         imageUrl = result?.secure_url || null;
       }

      const newKid = await new Kid({
        parentId,
        name,
        password: hashedPassword,
        photo: imageUrl
      })

      await newKid.save()

      return res.status(status_codes.HTTP_201_CREATED).json({ status: 201, success: true, message: "Kid's profile created successfully!" })
      
    } catch (error: any) {
      if (error.name === "ValidationError") {
        const errors = Object.values(error.errors).map((err: any) => err.message);
        return res.status(400).json({
          success: false,
          message: "Kid's account creation failed",
          errors, // Sends all validation errors (e.g., missing name, invalid values)
        });
      }
    
      console.error("Kid's account creation Error:", error);
      
      return res.status(status_codes.HTTP_500_INTERNAL_SERVER_ERROR).json({
        status: 500,
        success: false,
        message: "Internal Server Error",
      });
    }
  }
}


export default AuthService

