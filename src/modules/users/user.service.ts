import crypto from 'crypto';
import {
  check_if_user_exist_with_email,
  check_if_user_exists,
  getUserByEmailAndRole,
} from "../../utils/check_user_exists.utils.js";
import { Response, Request } from "express";
import {
  generateOTP,
  generateResetOtp,
  checkOtpRateLimit,
} from "../../utils/otp.utils.js";
import { OTPInput, RegisterInputForParent } from "./user.types.js";
import { Admin, Kid, Parent } from "./user.model.js";
import {
  sendResetPasswordEmail,
  sendVerificationEmail,
  sendWelcomeEmail,
  sendResetEmail,
} from "../../utils/email_sender.utils.js";
import { EGender, ERole, EStatus } from "../../models/enums.js";
import { status_codes } from "../../utils/status_constants.js";
import {
  generateTokens,
  verifyRefreshTokenAndIssueNewAccessToken,
} from "../../utils/token_management.js";
import RefreshToken from "./refresh.token.model.js";
import comparePassword from "../../utils/compare_password.js";
import { uploadSingleFile } from "../../utils/file_upload.utils.js";
import sendNotification from "../../utils/notifications.js";
import bcrypt from "bcrypt";
import CustomRequest from "../../models/CustomRequest.js";
import { SavingsWallet, Wallet } from "../wallets/wallet.model.js";
import {
  BadRequestError,
  NotFoundError,
  UnauthorizedError,
  UnprocessableEntityError,
} from "../../models/errors.js";
import paginate from "../../utils/paginate.js";
const OTP_EXPIRY_MINUTES = parseInt(process.env.OTP_EXPIRY_MINUTES || "5");

export class AuthService {
  static async registerParent(
    registerData: RegisterInputForParent,
    imageUrl: string | null
  ) {
    const existingParent = await Parent.findOne({ email: registerData.email });

    if (existingParent) {
      throw new Error("Parent with this email already exists");
    }

    const verificationToken = generateOTP();

    const newParent = new Parent({
      firstName: registerData.first_name,
      lastName: registerData.last_name,
      fullName: `${registerData.first_name} ${registerData.last_name}`,
      email: registerData.email,
      country: registerData.country,
      password: registerData.password,
      gender: registerData.gender?.toLowerCase() as EGender,
      verificationToken,
      verificationTokenExpiresAt: Date.now() + 5 * 60 * 1000, // 5 minutes
      phoneNumber: registerData.phone_number,
      role: ERole.Parent,
      photo: imageUrl,
      emailVerified: false,
    });

    await newParent.save();

    sendVerificationEmail(
      newParent.email,
      newParent.firstName,
      verificationToken
    );

    return newParent;
  }

  static async verifyRegistrationOTP(email: string, otp: string) {
    const parent: any = await Parent.findOne({
      email,
      verificationToken: otp,
      verificationTokenExpiresAt: { $gt: Date.now() },
    });

    if (!parent) {
      throw new BadRequestError("Invalid or expired OTP");
    }

    const isFirstTimeVerification = !parent.isVerified;
    parent.isVerified = true;
    parent.status = EStatus.Active;
    parent.verificationToken = undefined;
    parent.verificationTokenExpiresAt = undefined;

    await parent.save();

    if (isFirstTimeVerification) {
      await sendWelcomeEmail(parent.firstName, parent.email);
    }

    return parent;
  }

  static async verifyPasswordResetOTP(
    email: string,
    otp: string,
    userType: "parent" | "admin"
  ) {
    const Model: any = userType === "parent" ? Parent : Admin;

    const user = await Model.findOne({
      email,
      verificationToken: otp,
      verificationTokenExpiresAt: { $gt: Date.now() },
    });

    console.log("otp user", user);
    if (!user) {
      throw new BadRequestError("Invalid or expired OTP");
    }

    user.verificationToken = undefined;
    user.verificationTokenExpiresAt = undefined;
    await user.save();

    return user;
  }
  static async resetPassword(
    email: string,
    newPassword: string,
    userType: "parent" | "admin"
  ) {
    if (!email || !newPassword) {
      throw new BadRequestError("Email and new password are required");
    }

    const Model: any = userType === "parent" ? Parent : Admin;
    const user = await Model.findOne({ email: email });

    if (!user) {
      throw new NotFoundError("User not found");
    }

    // Hash and update password
    user.password = newPassword;

    // Clear any existing verification tokens
    user.verificationToken = undefined;
    user.verificationTokenExpiresAt = undefined;

    await user.save();

    return { success: true };
  }

  static async refreshToken(refreshToken: string) {
  if (!refreshToken) {
    throw new BadRequestError("Refresh token is required");
  }

  try {
    const tokens = await verifyRefreshTokenAndIssueNewAccessToken(refreshToken);
    return tokens;
  } catch (error: any) {
    console.error("Refresh token error:", error.message);
    throw new UnauthorizedError("Token invalid or expired. Please login again.");
  }
}

  static async resendOTP(email: string) {
    if (!email) {
      throw new Error("Email is required");
    }

    const user: any = await check_if_user_exist_with_email(email);
    if (!user) {
      throw new Error("User with this email not found");
    }

    const verificationToken = generateOTP();
    const verificationTokenExpiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes

    user.verificationToken = verificationToken;
    user.verificationTokenExpiresAt = verificationTokenExpiresAt;
    await user.save();

    sendVerificationEmail(
      user.email,
      user.firstName || user.fullName || "User",
      verificationToken
    );

    return { email };
  }

  static async loginParent(
    email: string,
    password: string,
    fcmToken?: string,
    role: ERole = ERole.Parent
  ) {
    // Input validation
    if (!email || !password) {
      throw new UnprocessableEntityError("Email and password are required");
    }

    // Find parent with role validation
    const parent: any = await Parent.findOne({ email, role });
    if (!parent) {
      throw new BadRequestError("Invalid credentials");
    }

    // Password verification
    const isPasswordValid = await comparePassword(password, parent.password);
    if (!isPasswordValid) {
      throw new BadRequestError("Invalid credentials");
    }

    // Device management (single device login)
    if (parent.fcmToken) {
      parent.fcmToken = null;
      await parent.save();
    }

    // Token generation
    const tokens = await generateTokens(parent);

    // Update FCM token if provided
    if (fcmToken) {
      parent.fcmToken = fcmToken;
      await parent.save();
    }

    return {
      tokens,
      parent: { ...parent.toObject(), password: undefined },
    };
  }

  static async logout(userId: string, refreshToken: any) {
    // Validate inputs

    // Verify user exists
    const user = await check_if_user_exists(userId);

    if (!user) {
      throw new UnauthorizedError("Unauthorized access");
    }

    // Delete refresh token
    const deletedToken = await RefreshToken.findOneAndDelete({
      refreshToken: refreshToken,
    });

    if (!deletedToken) {
      throw new Error("Refresh token not found");
    }

    // Clear FCM token
    user.fcmToken = null;
    await user.save();

    return { success: true };
  }

  static async initiatePasswordReset(email: string) {
    const user: any = await check_if_user_exist_with_email(email);

    if (!user) throw new Error("Account not found with this email");

    checkOtpRateLimit(user);

    const { otp, expiresAt } = generateResetOtp();

    user.verificationToken = otp;
    user.verificationTokenExpiresAt = expiresAt;
    user.lastOtpRequest = new Date();
    await user.save();

    sendResetEmail(user, otp);

    return {
      email,
      expiresInMinutes: OTP_EXPIRY_MINUTES,
    };
  }

static async editProfile(
    parentId: string,
    updateData: {
      first_name?: string;
      last_name?: string;
      phone_number?: string;
      country?: string;
      gender?: EGender;
    },
    file?: Express.Multer.File
  ) {
    // Find existing parent
    const existingParent = await Parent.findById(parentId);
    if (!existingParent) {
      throw new Error(`Parent with the id: ${parentId} not found`);
    }

    // Filter out undefined, null, and empty string values
    const filteredUpdateData = Object.entries(updateData).reduce((acc, [key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        acc[key] = value;
      }
      return acc;
    }, {} as any);

    // Handle file upload if provided
    if (file) {
      try {
        const result = await uploadSingleFile(file);
        if (result?.secure_url) {
          existingParent.photo = result.secure_url;
        }
      } catch (error) {
        console.error('File upload failed:', error);
        throw new Error('Failed to upload profile photo');
      }
    }

    let nameChanged = false;
  
    // Update fields (fullName will be auto-updated by pre-save hook)
    if (filteredUpdateData.first_name?.trim()) {
      existingParent.firstName = filteredUpdateData.first_name.trim();
      nameChanged = true;
    }
    if (filteredUpdateData.last_name?.trim()) {
      existingParent.lastName = filteredUpdateData.last_name.trim();
      nameChanged = true;
    }
    if (filteredUpdateData.phone_number) {
      existingParent.phoneNumber = filteredUpdateData.phone_number;
    }
    if (filteredUpdateData.gender) {
      existingParent.gender = filteredUpdateData.gender;
    }
    if (filteredUpdateData.country) {
      existingParent.country = filteredUpdateData.country;
  }
  
   if (nameChanged) {
    existingParent.fullName = `${existingParent.firstName} ${existingParent.lastName}`.trim();
  }

  
    await existingParent.save(); // Pre-save hook will handle fullName update

    return {
      ...existingParent.toObject(),
      password: undefined,
    };
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
      const { name, password, gender } = req.body;

      const parentId = req.user;

      const existingParent = await Parent.findById({ _id: parentId });
      if (!existingParent) {
        return res.status(status_codes.HTTP_404_NOT_FOUND).json({
          status: 404,
          success: false,
          message: `Parent with the id: ${parentId} not found`,
        });
      }

      const existingKid = await Kid.findOne({ parentId, name });

      if (existingKid) {
        return res.status(status_codes.HTTP_400_BAD_REQUEST).json({
          status: 400,
          success: false,
          message: `Kid with this account name already exists under your account`,
        });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      // Upload image if provided
      let imageUrl: string | null = null;

      if (req.body.photo) {
        // Parent selected an avatar from predefined options
        imageUrl = req.body.photo;
      } else if (req.file) {
        // Parent uploaded a photo (from gallery or camera)
        const result = await uploadSingleFile(req.file);
        imageUrl = result?.secure_url || null;
      }

      const newKid = await new Kid({
        parentId,
        name,
        gender: gender,
        password: hashedPassword,
        photo: imageUrl,
        status: EStatus.Active,
      });

      await newKid.save();

      const wallet = await new Wallet({
        kid: newKid._id,
        balance: 0,
      });

      await wallet.save();

      const savingsWallet = new SavingsWallet({
        kid: newKid._id,
        balance: 0,
        savingsGoals: [],
      });
      await savingsWallet.save();

      return res.status(status_codes.HTTP_201_CREATED).json({
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

      const existingParent = await Parent.findById(parentId);

      if (!existingParent) {
        return res.status(status_codes.HTTP_404_NOT_FOUND).json({
          status: 404,
          success: false,
          message: `Parent with the id: ${parentId} not found`,
        });
      }

      const { id } = req.params;

      if (!id) {
        return res
          .status(status_codes.HTTP_400_BAD_REQUEST)
          .json({ status: 400, success: false, message: "Provide a valid id" });
      }

      const existingKid = await Kid.findByIdAndDelete(id);

      if (!existingKid) {
        return res.status(status_codes.HTTP_404_NOT_FOUND).json({
          status: 404,
          success: false,
          message: `Kid's profile not found`,
        });
      }

      return res.status(status_codes.HTTP_200_OK).json({
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
        error: error?.message,
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

      const kid: any = await Kid.findOne({ name: name, role: role });
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
          password: undefined,
        },
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
        return res.status(status_codes.HTTP_400_BAD_REQUEST).json({
          status: 400,
          success: false,
          message: "Please provide a valid Id",
        });
      }

      const { id } = req.params;

      const user = await Parent.findById(id);

      if (!user) {
        return res.status(status_codes.HTTP_404_NOT_FOUND).json({
          status: 404,
          success: false,
          message: "Parent's profile not found",
        });
      }

      return res.status(status_codes.HTTP_200_OK).json({
        status: 200,
        data: {
          ...user.toObject(),
          password: undefined,
        },
      });
    } catch (error: any) {
      console.error("Fetching parent error:", error);
      return res.status(status_codes.HTTP_500_INTERNAL_SERVER_ERROR).json({
        status: 500,
        success: false,
        message: "Internal Server Error",
        error: error?.message,
      });
    }
  }

  static async fetchKid(kidId: any) {
    const kid = await Kid.findById(kidId);
    if (!kid) {
      throw new NotFoundError("Kid's profile not found ");
    }
    const data = { ...kid.toObject(), password: undefined };
    return data;
  }

  static async FetchKidsForSingleParent(req: Request, res: Response) {
    try {
      const parent = await Parent.findById(req.user);

      if (!parent) {
        return res.status(status_codes.HTTP_401_UNAUTHORIZED).json({
          status: 401,
          success: false,
          message: "Unauthorized access!",
        });
      }

      const kids = await Kid.find({ parentId: parent._id });

      if (!kids || kids.length == 0) {
        return res.status(status_codes.HTTP_404_NOT_FOUND).json({
          status: 404,
          success: false,
          message: "Kids' profiles not found",
        });
      }
      return res.status(status_codes.HTTP_200_OK).json({
        status: 200,
        success: true,
        data: kids,
      });
    } catch (error: any) {
      console.error("Fetching kid error:", error);
      return res.status(status_codes.HTTP_500_INTERNAL_SERVER_ERROR).json({
        status: 500,
        success: false,
        message: "Internal Server Error",
        error: error?.message,
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
      const existingParent = await Parent.findById(id);
      if (!existingParent) {
        return res.status(status_codes.HTTP_404_NOT_FOUND).json({
          status: 404,
          success: false,
          message: `Parent with ID: ${id} not found`,
        });
      }

      // Delete parent and their children in parallel
      await Promise.all([
        Parent.findByIdAndDelete(id),
        Kid.deleteMany({ parentId: id }),
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
    const admin = await Admin.findOne({ email: email });
    if (admin) {
      throw new BadRequestError("Admin with this email already exists!");
    }

    const newAdmin = new Admin({
      fullName,
      email,
      password,
    });

    await newAdmin.save();

    return { ...newAdmin.toObject(), password: undefined };
  }

  static async LoginAdmin(email: string, password: string, fcmToken: string) {
    const admin: any = await Admin.findOne({ email: email });

    if (!admin) {
      throw new BadRequestError("Invalid credentials!");
    }

    const isPasswordValid = await comparePassword(password, admin.password);

    if (!isPasswordValid) {
      throw new BadRequestError("Invalid credentials!");
    }

    const loggedAdmin = {
      ...admin.toObject(),
      password: undefined,
    };

    const { access_token, refresh_token } = await generateTokens(admin);

    return {
      access_token,
      refresh_token,
      loggedAdmin,
    };
  }

  static async FetchTotalNumberOfUsers() {
    const totalParents = await this.FetchTotalNumberOfParents();
    const totalKids = await this.FetchTotalNumberOfKids();
    const totalAdmins = await Admin.countDocuments();

    const totalUsers =
      totalParents.totalParents + totalKids.totalKids + totalAdmins;
    return { totalUsers: totalUsers };
  }

  static async FetchTotalNumberOfParents() {
    const totalParents = await Parent.countDocuments();
    return { totalParents: totalParents };
  }

  static async FetchTotalNumberOfKids() {
    const totalKids = await Kid.countDocuments();
    return { totalKids: totalKids };
  }

  static async getGenderStatistics() {
    try {
      // Execute all counts in parallel for better performance
      const [maleParents, femaleParents, maleKids, femaleKids] =
        await Promise.all([
          Parent.countDocuments({ gender: EGender.Male }),
          Parent.countDocuments({ gender: EGender.Female }),
          Kid.countDocuments({ gender: EGender.Male }),
          Kid.countDocuments({ gender: EGender.Female }),
        ]);

      const maleStats = maleParents + maleKids;
      const femaleStats = femaleParents + femaleKids;
      const totalStats = maleStats + femaleStats;

      // Handle division by zero (empty database case)
      if (totalStats === 0) {
        return {
          men: "0.00",
          women: "0.00",
          note: "No records found in database",
        };
      }

      // Format percentages with 2 decimal places
      return {
        men: ((maleStats / totalStats) * 100).toFixed(2),
        women: ((femaleStats / totalStats) * 100).toFixed(2),
      };
    } catch (error) {
      console.error("Error in getGenderStatistics:", error);
      throw new Error("Failed to retrieve gender statistics");
    }
  }
  static async fetchParents(page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const parents = await Parent.find({})
      .select("fullName email phoneNumber gender createdAt status")
      .skip(skip)
      .limit(limit)
      .lean();

    const totalParents = await Parent.countDocuments();

    // Get kids count for each parent
    const parentsWithKidsCount = await Promise.all(
      parents.map(async (parent) => {
        const kidsCount = await Kid.countDocuments({ parentId: parent._id });
        return {
          ...parent,
          createdAt: new Date(parent.createdAt).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          }),
          kidsCount,
        };
      })
    );

    // Format response
    const formattedParents = parentsWithKidsCount.map((parent) => ({
      parentId: parent._id,
      fullName: parent.fullName,
      email: parent.email,
      phoneNumber: parent.phoneNumber,
      gender: parent.gender,
      createdAt: parent.createdAt,
      status: parent.status,
      kidsCount: parent.kidsCount,
    }));

    // Return paginated response
    return {
      data: formattedParents,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalParents / limit),
        totalItems: totalParents,
        itemsPerPage: limit,
      },
    };
  }

  static async fetchKidsForParent(parentId: any) {
    const parent = await Parent.findById(parentId);
    if (!parent) {
      throw new NotFoundError("Parent not found");
    }
    const kids = await Kid.find({ parentId: parentId });
    return kids;
  }

  static async registerBiometric(userId: any, publicKey: any) {
    if (!publicKey) {
      throw new BadRequestError(
        "Public key is required for biometric registration"
      );
    }
    const parent = await Parent.findById(userId);
    if (!parent) {
      throw new NotFoundError("Parent not found");
    } else {
      parent.biometricKey = publicKey;
      await parent.save();
    }
    const kid = await Kid.findById(userId);
    if (!kid) {
      throw new NotFoundError("Kid not found");
    } else {
      kid.biometricKey = publicKey;
      await kid.save();
    }
    return { success: true, message: "Biometric registration successful" };
  }

  static async verifyBiometric(
    userId: any,
    challenge: any,
    signature: any)
  {
    if (!userId || !challenge || !signature) {
      throw new BadRequestError(
        "UserId, Challenge and signature are required for biometric verification"
      );
    }

    const parent = await Parent.findById(userId);
    if (parent && parent.biometricKey) {
      const isVerified = crypto.verify(
        "sha256",
        Buffer.from(challenge, "base64"),
        {
          key: parent.biometricKey,
          padding: crypto.constants.RSA_PKCS1_PSS_PADDING,
        },
        Buffer.from(signature, "base64")
      );

      if (isVerified) {
        return { success: true, message: "Biometric verification successful" };
      } else {
        throw new UnauthorizedError("Biometric verification failed");
      }
    }

    const kid = await Kid.findById(userId);
    if (kid && kid.biometricKey) {
      const isVerified = crypto.verify(
        "sha256",
        Buffer.from(challenge, "base64"),
        {
          key: kid.biometricKey,
          padding: crypto.constants.RSA_PKCS1_PSS_PADDING,
        },
        Buffer.from(signature, "base64")
      );

      if (isVerified) {
        return { success: true, message: "Biometric verification successful" };
      } else {
        throw new UnauthorizedError("Biometric verification failed");
      }
    }

    throw new NotFoundError("User not found or biometric key not registered");
  }
}
