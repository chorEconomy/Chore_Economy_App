import {
  check_if_user_exist_with_email,
  check_if_user_or_kid_exists,
  getKidByNameAndRole,
  getUserByEmailAndRole,
} from "../../utils/check_user_exists.utils.js";
import { Response, Request } from "express";
import generateOTP from "../../utils/otp.utils.js";
import { OTPInput, RegisterInputForParent } from "./user.types.js";
import { Kid, User } from "./user.model.js";
import {
  sendResetPasswordEmail,
  sendVerificationEmail,
  sendWelcomeEmail,
} from "../../utils/email_sender.utils.js";
import { EGender, ERole, EStatus } from "../../models/enums.js";
import {status_codes} from "../../utils/status_constants.js";
import {
  decode_token,
  generate_reset_token,
  generateTokens,
  verifyRefreshTokenAndIssueNewAccessToken,
} from "../../utils/token_management";
import RefreshToken from "./refresh.token.model";
import comparePassword from "../../utils/compare_password";
import { uploadSingleFile } from "../../utils/file_upload.utils";
import sendNotification from "../../utils/notifications";
import bcrypt from 'bcrypt';
import CustomRequest from "../../models/CustomRequest";
import { SavingsWallet, Wallet } from "../wallets/wallet.model";


export class AuthService {
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

    await sendVerificationEmail(
      newUser.email,
      newUser.firstName,
      verificationToken
    );

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
      const userAlreadyExists = await check_if_user_exist_with_email(
        req.body.email
      );
      if (userAlreadyExists) {
        return res.status(status_codes.HTTP_409_CONFLICT).json({
          status: 409,
          success: false,
          message: "User with this email already exists!",
        });
      }
  
      // Determine profile image source
      let imageUrl: string | null = null;

      if (req.body.photo) {
        // User selected an avatar from predefined options
        imageUrl = req.body.photo;
      } else if (req.file) {
        // User uploaded a photo (from gallery or camera)
        const result = await uploadSingleFile(req.file);
        imageUrl = result?.secure_url || null;
      }
      // Register the user with the selected or uploaded image URL
      const user = await AuthService.register(req.body, imageUrl);
  
      return res.status(status_codes.HTTP_201_CREATED).json({
        status: 201,
        success: true,
        message: "User created successfully",
        data: {
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
            verificationTokenExpiresAt: { $gt: Date.now() },
        });

        if (!user) {
            return "Invalid or expired OTP";
        }

        const isFirstTimeVerification = !user.isVerified; // Check if email was not verified before

        user.isVerified = true;
        user.status = EStatus.Active;
        user.verificationToken = undefined;
        user.verificationTokenExpiresAt = undefined;

        await user.save();

        if (isFirstTimeVerification) {
            await sendWelcomeEmail(user.firstName, user.email);
        }

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
        user: {...user.toObject(), password: undefined}
      });
    } catch (error: any) {
      console.error("Verify Email error:", error);
      return res.status(status_codes.HTTP_500_INTERNAL_SERVER_ERROR).json({
        status: 500,
        success: false,
        message: error?.message,
      });
    }
  }

  static async RefreshToken(req: Request, res: Response) {
    try {
      const { refresh_token } = req.body;

      if (!refresh_token) {
        return res.status(status_codes.HTTP_422_UNPROCESSABLE_ENTITY).json({
          status: 422,
          message: "Refresh token is required",
        });
      }

      try {
        const { newAccessToken, newRefreshToken } =
          await verifyRefreshTokenAndIssueNewAccessToken(refresh_token);

        return res.status(status_codes.HTTP_200_OK).json({
          status: 200,
          access_token: newAccessToken,
          refresh_token: newRefreshToken,
        });
      } catch (error: any) {
        if (
          error instanceof Error &&
          error.message === "Invalid or expired refresh token"
        ) {
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
      const { email } = req.body;
      if (!email) {
        return res
          .status(status_codes.HTTP_400_BAD_REQUEST)
          .json({ status: 400, message: "Email is required" });
      }

      const user = await check_if_user_exist_with_email(email);

      if (!user) {
        return res
          .status(status_codes.HTTP_404_NOT_FOUND)
          .json({ status: 404, message: "User with this email not found!" });
      }

      const verificationToken = generateOTP();

      user.verificationToken = verificationToken;
      user.verificationTokenExpiresAt = Date.now() + 5 * 60 * 1000;

      await user.save();

      await sendVerificationEmail(
        user.email,
        user.firstName,
        verificationToken
      );

      return res
        .status(status_codes.HTTP_200_OK)
        .json({
          status: 200,
          success: true,
          message: "OTP resent successfully.",
        });
    } catch (error) {
      return res
        .status(500)
        .json({ status: 500, message: "Internal Server Error" });
    }
  }

  static async Login(req: Request, res: Response) {
    try {
      if (!req.body) {
        return res.status(422).json({
          success: false,
          message: "Unprocessable request body",
        });
      }
  
      const role = req.query.role as string;
      if (!role) {
        return res.status(400).json({
          success: false,
          message: "Please provide a valid user's role",
        });
      }
  
      const user = await getUserByEmailAndRole(req.body.email, role);
      
      if (!user) {
        return res.status(400).json({
          success: false,
          message: "Invalid credentials!",
        });
      }
  
      const isPasswordValid = await comparePassword(req.body.password, user.password);
      if (!isPasswordValid) {
        return res.status(400).json({
          success: false,
          message: "Invalid credentials!",
        });
      }
 
        // **Ensure only one login per device**
        if (user.fcmToken) {
          user.fcmToken = null; // Remove old FCM token
          await user.save();
        }
  
  
      // **Generate new tokens**
      const { access_token, refresh_token } = await generateTokens(user);
  
      user.fcmToken = req.body.fcmToken;
      await user.save();
  
      return res.status(200).json({
        success: true,
        access_token,
        refresh_token,
        user: { ...user.toObject(), password: undefined },
      });
  
    } catch (error) {
      console.error("Login error:", error);
      return res.status(500).json({
        success: false,
        message: "An error occurred during login",
      });
    }
  }
  

  static async Logout(req: Request, res: Response) {
    try {
      const user = await check_if_user_or_kid_exists(req.user)
      if (!user) {
        return res.status(status_codes.HTTP_401_UNAUTHORIZED).json({status: 401, message: "Unauthorized access"})
      }

      const { refresh_token } = req.body;

      if (!refresh_token) {
        return res
          .status(400)
          .json({ status: 400, message: "Refresh token is required" });
      }

      const deletedToken = await RefreshToken.findOneAndDelete({
        refreshToken: refresh_token,
      });

      if (!deletedToken) {
        return res
          .status(404)
          .json({ status: 404, message: "Refresh token not found" });
      }

      user.fcmToken = null

      await user.save()

      return res
        .status(200)
        .json({ status: 200, message: "Logged out successfully" });
    } catch (error) {
      console.error("Logout error:", error);
      return res
        .status(500)
        .json({ status: 500, message: "Internal Server Error" });
    }
  }

 
static async ForgotPassword(req: Request, res: Response) {
  try {
    if (!req.body?.email) {
      return res.status(status_codes.HTTP_422_UNPROCESSABLE_ENTITY).json({
        status: 422,
        success: false,
        message: "Email is required",
      });
    }

    const { email } = req.body;
    const user = await check_if_user_exist_with_email(email);

    if (!user) {
      return res.status(status_codes.HTTP_404_NOT_FOUND).json({
        status: 404,
        success: false,
        message: "User not found",
      });
    }

    // Prevent multiple OTP requests within a short time
    if (user.verificationTokenExpiresAt && user.verificationTokenExpiresAt > Date.now()) {
      return res.status(status_codes.HTTP_429_TOO_MANY_REQUESTS).json({
        status: 429,
        success: false,
        message: "OTP already sent. Please wait before requesting again.",
      });
    }

    // Generate OTP
    const otp = generateOTP();
    user.verificationToken = otp;
    user.verificationTokenExpiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes expiration

    await user.save();
    sendResetPasswordEmail(user.firstName, user.email, otp);

    return res.status(status_codes.HTTP_200_OK).json({
      success: true,
      status: 200,
      message: "Password reset OTP sent to your email.",
    });
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
    if (!req.body?.email || !req.body?.password) {
      return res.status(status_codes.HTTP_422_UNPROCESSABLE_ENTITY).json({
        status: 422,
        success: false,
        message: "Email and new password are required",
      });
    }

    const { email, password } = req.body;

    // Find user by email
    const user: any = await User.findOne({ email });

    if (!user) {
      return res.status(status_codes.HTTP_404_NOT_FOUND).json({
        status: 404,
        success: false,
        message: "User not found",
      });
    }
    console.log(user.password );
    
     
    user.password = password
    
    await user.save();
    console.log(user.password );
    
    return res.status(status_codes.HTTP_200_OK).json({
      status: 200,
      success: true,
      message: "Password reset successful",
    });
    
  } catch (error: any) {
    console.error("Password reset error:", error);
    return res.status(status_codes.HTTP_500_INTERNAL_SERVER_ERROR).json({
      status: 500,
      success: false,
      message: "Internal Server Error",
      error: error?.message,
    });
  }
}


  static async EditProfile(req: Request, res: Response) {
    try {
      if (Object.keys(req.body).length === 0 && !req.file) {
        return res.status(status_codes.HTTP_422_UNPROCESSABLE_ENTITY).json({
          status: 422,
          success: false,
          message: "No data provided for update",
        });
      }

      if (!req.user) {
        return res.status(status_codes.HTTP_401_UNAUTHORIZED).json({
          status: 401,
          success: false,
          message: "Unauthorized access",
        });
      }

      const parentId = req.user;

      const existingParent = await User.findById(parentId);

      if (!existingParent) {
        return res
          .status(status_codes.HTTP_404_NOT_FOUND)
          .json({
            status: 404,
            success: false,
            message: `Parent with the id: ${parentId} not found`,
          });
      }

      const {first_name, last_name, phone_number, country, gender} = req.body
         
      // Upload image if provided
         let imageUrl: string | null = "";
         if (req.file) {
           const result = await uploadSingleFile(req.file);
           imageUrl = result?.secure_url || existingParent.photo;
         }
       
        existingParent.firstName = first_name ?? existingParent.firstName;
        existingParent.lastName = last_name ?? existingParent.lastName;
        existingParent.photo = imageUrl;
        existingParent.phoneNumber = phone_number ?? existingParent.phoneNumber;
        existingParent.gender = gender ?? existingParent.gender;
        existingParent.country = country ?? existingParent.country;

      await existingParent.save()

      return res
      .status(status_codes.HTTP_200_OK)
      .json({
        status: 200,
        success: true,
        message: "Profile updated successfully",
        data: {
          ...existingParent.toObject(),
          password: undefined
        }
      });
    } catch (error: any) {
      console.error("Password reset error:", error);
      return res.status(status_codes.HTTP_500_INTERNAL_SERVER_ERROR).json({
        status: 500,
        success: false,
        message: "Internal Server Error",
        error: error?.message
      });
    }
  }

  static async CreateKidProfile(req: Request, res: Response) {
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
      const { name, password } = req.body;

      const parentId = req.user;

      const existingParent = await User.findById({ _id: parentId });
      if (!existingParent) {
        return res
          .status(status_codes.HTTP_404_NOT_FOUND)
          .json({
            status: 404,
            success: false,
            message: `Parent with the id: ${parentId} not found`,
          });
      }

      const existingKid = await Kid.findOne({ parentId, name });

      if (existingKid) {
        return res
          .status(status_codes.HTTP_400_BAD_REQUEST)
          .json({
            status: 400,
            success: false,
            message: `Kid with this account name already exists under your account`,
          });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      // Upload image if provided
      let imageUrl: string | null = null;

      if (req.body.photo) {
        // User selected an avatar from predefined options
        imageUrl = req.body.photo;
      } else if (req.file) {
        // User uploaded a photo (from gallery or camera)
        const result = await uploadSingleFile(req.file);
        imageUrl = result?.secure_url || null;
      }

      const newKid = await new Kid({
        parentId,
        name,
        password: hashedPassword,
        photo: imageUrl,
        status: EStatus.Active
      });

      await newKid.save();

      const wallet = await new Wallet({
        kid: newKid._id,
        balance: 0
      });

      await wallet.save()

      const savingsWallet = new SavingsWallet({
        kid: newKid._id,
        balance: 0,
        savingsGoals: []
    });
    await savingsWallet.save();

      return res
        .status(status_codes.HTTP_201_CREATED)
        .json({
          status: 201,
          success: true,
          message: "Kid's profile created successfully!",
          data: { ...newKid.toObject(), password: undefined },
        });
    } catch (error: any) {
      if (error.name === "ValidationError") {
        const errors = Object.values(error.errors).map(
          (err: any) => err.message
        );
        return res.status(400).json({
          success: false,
          message: "Kid's account creation failed",
          errors, // Sends all validation errors (e.g., missing name, invalid values)
        });
      }

      return res.status(status_codes.HTTP_500_INTERNAL_SERVER_ERROR).json({
        status: 500,
        success: false,
        message: "Internal Server Error",
      });
    }
  }

  static async DeleteKidProfile(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(status_codes.HTTP_401_UNAUTHORIZED).json({
          status: 401,
          success: false,
          message: "Unauthorized access",
        });
      }

      const parentId = req.user;

      const existingParent = await User.findById(parentId);

      if (!existingParent) {
        return res
          .status(status_codes.HTTP_404_NOT_FOUND)
          .json({
            status: 404,
            success: false,
            message: `Parent with the id: ${parentId} not found`,
          });
      }

      const {id} = req.params

      if (!id) {
        return res.status(status_codes.HTTP_400_BAD_REQUEST).json({status: 400, success: false, message: "Provide a valid id"})
      }

      const existingKid = await Kid.findByIdAndDelete(id)
      
      if (!existingKid) {
        return res
          .status(status_codes.HTTP_404_NOT_FOUND)
          .json({
            status: 404,
            success: false,
            message: `Kid's profile not found`,
          });
      }

      return res
          .status(status_codes.HTTP_200_OK)
          .json({
            status: 200,
            success: false,
            message: `Kid's profile deleted successfully`,
          });

    } catch (error: any) {
      console.error("Delete kid profile error:", error);
      return res.status(status_codes.HTTP_500_INTERNAL_SERVER_ERROR).json({
        status: 500,
        success: false,
        message: "Internal Server Error",
        error: error?.message
      });
    }
  }

  static async LoginKid(req: Request, res: Response) {
    try {
      if (!req.body) {
        return res.status(status_codes.HTTP_422_UNPROCESSABLE_ENTITY).json({
          status: 422,
          success: false,
          message: "Unprocessable request body",
        });
      }

      const { name, password, fcmToken } = req.body; // Accept FCM token
      const role = req.query.role as string;

      if (!name || !password || !role || !fcmToken) {
        return res.status(status_codes.HTTP_400_BAD_REQUEST).json({
          status: 400,
          success: false,
          message: "Name, password, role, and FCM token are required",
        });
      }

      const kid = await getKidByNameAndRole(name, role);
      if (!kid) {
        return res.status(status_codes.HTTP_400_BAD_REQUEST).json({
          status: 400,
          success: false,
          message: "Invalid credentials!",
        });
      }

      // Validate password
      const isPasswordValid = await comparePassword(password, kid.password);
      if (!isPasswordValid) {
        return res.status(status_codes.HTTP_400_BAD_REQUEST).json({
          status: 400,
          success: false,
          message: "Invalid credentials!",
        });
      }

      // **Ensure only one login per device**
      if (kid.fcmToken) {
        kid.fcmToken = null; // Remove old FCM token
        await kid.save();
      }
      kid.fcmToken = fcmToken; // Save new FCM token
      await kid.save();

      // Generate new tokens
      const { access_token, refresh_token } = await generateTokens(kid);

      return res.status(status_codes.HTTP_200_OK).json({
        success: true,
        access_token,
        refresh_token,
        data: {
          ...kid.toObject(),
          password: undefined
        }
      });

    } catch (error: any) {
      console.error("Login kid error:", error);
      return res.status(status_codes.HTTP_500_INTERNAL_SERVER_ERROR).json({
        status: 500,
        success: false,
        message: "Internal Server Error",
        error: error?.message,
      });
    }
  }

  static async FetchParent(req: Request, res: Response) {
    try {
       if (!req.params) {
          return res.status(status_codes.HTTP_400_BAD_REQUEST).json({status: 400, success: false, message: "Please provide a valid Id"})
      }
      
      const {id} = req.params

      const user = await User.findById(id)

      if (!user) {
        return res.status(status_codes.HTTP_404_NOT_FOUND).json({status: 404, success: false, message: "Parent's profile not found"})
      }

      return res.status(status_codes.HTTP_200_OK).json({
        status: 200,
        data: {
          ...user.toObject(),
          password: undefined
        }
      })

    } catch (error: any) {
      console.error("Fetching parent error:", error);
      return res.status(status_codes.HTTP_500_INTERNAL_SERVER_ERROR).json({
        status: 500,
        success: false,
        message: "Internal Server Error",
        error: error?.message
      });
    }
  }

  static async FetchKid(req: Request, res: Response) {
    try {
       if (!req.params) {
          return res.status(status_codes.HTTP_400_BAD_REQUEST).json({status: 400, success: false, message: "Please provide a valid Id"})
      }
      
      const {id} = req.params

      const user = await Kid.findById(id)

      if (!user) {
        return res.status(status_codes.HTTP_404_NOT_FOUND).json({status: 404, success: false, message: "Kid's profile not found"})
      }

      return res.status(status_codes.HTTP_200_OK).json({
        status: 200,
        data: {
          ...user.toObject(),
          password: undefined
        }
      })

    } catch (error: any) {
      console.error("Fetching kid error:", error);
      return res.status(status_codes.HTTP_500_INTERNAL_SERVER_ERROR).json({
        status: 500,
        success: false,
        message: "Internal Server Error",
        error: error?.message
      });
    }
  }

  static async FetchKidsForSingleParent(req: Request, res: Response) {
    try {
      const parent = await User.findById(req.user)
      
      if (!parent) {
        return res.status(status_codes.HTTP_401_UNAUTHORIZED).json({status: 401, success: false, message: "Unauthorized access!"})
      }

      const kids = await Kid.find({parentId: parent._id})

      if (!kids || kids.length == 0) {
        return res.status(status_codes.HTTP_404_NOT_FOUND).json({status: 404, success: false, message: "Kids' profiles not found"})
      }
      return res.status(status_codes.HTTP_200_OK).json({
        status: 200,
        success: true,
        data: kids
      })

    } catch (error: any) {
      console.error("Fetching kid error:", error);
      return res.status(status_codes.HTTP_500_INTERNAL_SERVER_ERROR).json({
        status: 500,
        success: false,
        message: "Internal Server Error",
        error: error?.message
      });
    }
  }

  static async DeleteParent(req: Request, res: Response) {
    try {
        if (!req.user) {
            return res.status(status_codes.HTTP_401_UNAUTHORIZED).json({
                status: 401,
                success: false,
                message: "Unauthorized access",
            });
        }
        const id = req.user;

        // Find parent first
        const existingParent = await User.findById(id);
        if (!existingParent) {
            return res.status(status_codes.HTTP_404_NOT_FOUND).json({
                status: 404,
                success: false,
                message: `Parent with ID: ${id} not found`,
            });
        }

        // Delete parent and their children in parallel
        await Promise.all([
            User.findByIdAndDelete(id),
            Kid.deleteMany({ parentId: id })
        ]);

        return res.status(status_codes.HTTP_200_OK).json({
            status: 200,
            success: true,
            message: "Parent and associated kids deleted successfully",
        });
    } catch (error: any) {
        console.error("Error deleting parent:", error);
        return res.status(status_codes.HTTP_500_INTERNAL_SERVER_ERROR).json({
            status: 500,
            success: false,
            message: "Internal Server Error",
            error: error.message,
        });
    }
  }
  

  static async SignUpAdmin(fullName: string, email: string, password: string) {
    
  }

  static async FetchTotalNumberOfUsers() {
    const totalParents = await this.FetchTotalNumberOfParents()
    const totalKids = await this.FetchTotalNumberOfKids()

    const totalUsers = totalParents + totalKids
    return totalUsers
  }
  
  static async FetchTotalNumberOfParents() {
    const totalParents = await User.countDocuments({ role: ERole.Parent })
    return totalParents
  }
 
  static async FetchTotalNumberOfKids() {
    const totalKids = await Kid.countDocuments()
    return totalKids
  }
}
 
