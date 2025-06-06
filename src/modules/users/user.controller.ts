import { NextFunction, Request, Response } from "express";
import { AuthService } from "./user.service.js";
import asyncHandler from "express-async-handler";
import { BadRequestError, UnauthorizedError, UnprocessableEntityError } from "../../models/errors.js";
import { status_codes } from "../../utils/status_constants.js";
import { Admin } from "./user.model.js";
import { generateTokens } from "../../utils/token_management.js";
import { validateRequiredFields, validateUserType } from "../../utils/validation.utils.js";
import { uploadSingleFile } from "../../utils/file_upload.utils.js";
import { ERole } from "../../models/enums.js";
import { check_if_user_exists } from "../../utils/check_user_exists.utils.js";

class UserController {
  static registerParent = asyncHandler(async (req: Request, res: Response) => {
    if (!req.body) { 
      throw new Error('Unprocessable request body');
    }
 
    let imageUrl: string | null = null;
    
    if (req.body.photo) { 
      imageUrl = req.body.photo;
    } else if (req.file) { 

      const result = await uploadSingleFile(req.file);
      imageUrl = result?.secure_url || null;
    }
 
    const user = await AuthService.registerParent(req.body, imageUrl);
 
    res.status(status_codes.HTTP_201_CREATED).json({
      status: 201,
      success: true,
      message: 'Parent created successfully',
      data: {
        ...user.toObject(),
        password: undefined, 
      },
    });
  });

  static verifyRegistration = asyncHandler(async (req: Request, res: Response) => {
    const { email, otp } = req.body;
    
    validateRequiredFields({ email, otp });

    const parent = await AuthService.verifyRegistrationOTP(email, otp);
    const { access_token, refresh_token } = await generateTokens(parent);

    res.status(status_codes.HTTP_200_OK).json({
      status: 200,
      success: true,
      message: "Email verified successfully! Parent logged in.",
      access_token,
      refresh_token,
      user: { ...parent.toObject(), password: undefined },
    });
    return;
  });

  static verifyPasswordReset = asyncHandler(async (req: Request, res: Response) => {
    const { email, otp, userType } = req.body;
    
    validateRequiredFields({ email, otp, userType });
    validateUserType(userType);

    await AuthService.verifyPasswordResetOTP(email, otp, userType);

    res.status(status_codes.HTTP_200_OK).json({
      status: 200,
      success: true,
      message: "Email verified successfully! You can now reset your password.",
    });
    return;
  });

  static resendOTP = asyncHandler(async (req: Request, res: Response) => {
    const { email } = req.body;

    await AuthService.resendOTP(email);

    res.status(status_codes.HTTP_200_OK).json({
      status: 200,
      success: true,
      message: 'OTP resent successfully',
    });
  });

  static logout = asyncHandler(async (req: Request, res: Response) => {

    const user = await check_if_user_exists(req.user)
    if (!user) {
      throw new UnauthorizedError("Unauthorized access")
    }
     
    const { refresh_token } = req.body;
    console.log("refresh_token", refresh_token)

 if (!refresh_token) {
      throw new BadRequestError('Refresh token is required');
    }

    await AuthService.logout(user._id, refresh_token);

    res.status(status_codes.HTTP_200_OK).json({
      status: 200,
      message: 'Logged out successfully'
    });
    return;
  });

  static parentLogin = asyncHandler(async (req: Request, res: Response) => {
    // Validate request body
    if (!req.body) {
      throw new UnprocessableEntityError('Unprocessable request body');
    }

    // Validate role
    const role = req.query.role as ERole;
    if (!role || role !== ERole.Parent) {
      throw new BadRequestError("Invalid user role");
    }

    const { email, password, fcmToken } = req.body;
    const { tokens, parent } = await AuthService.loginParent(
      email,
      password,
      fcmToken,
      role
    );
    res.status(status_codes.HTTP_200_OK).json({
      success: true,
      ...tokens,
      parent
    });
    return
  });

  static refreshToken = asyncHandler(async (req: Request, res: Response) => {
    const { refresh_token } = req.body;

    const { newAccessToken, newRefreshToken } = await AuthService.refreshToken(refresh_token);

    res.status(status_codes.HTTP_200_OK).json({
      status: 200,
      access_token: newAccessToken,
      refresh_token: newRefreshToken,
    });
    return;
  });

  static forgotPassword = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
      if (!req.body.email) {
        throw new UnprocessableEntityError("Email is required");
    }
    
    const { email, expiresInMinutes } = await AuthService.initiatePasswordReset(req.body.email);

     res.status(status_codes.HTTP_200_OK).json({
      status: 200,
      success: true,
      message: `Password reset OTP sent to ${email}. Valid for ${expiresInMinutes} minutes.`,
     });
    return
  })
  
  static resetPassword = asyncHandler(async (req: Request, res: Response) => {
    const { email, newPassword, userType } = req.body;

    if (!email || !newPassword || !userType) {
      throw new UnprocessableEntityError("Please add all required fields")
    }

    await AuthService.resetPassword(email, newPassword, userType);

    res.status(status_codes.HTTP_200_OK).json({
      status: 200,
      success: true,
      message: 'Password reset successful'
    });
    return
  });

  static editProfile = asyncHandler(async (req: Request, res: Response) => {
    // Check for empty update
    if (Object.keys(req.body).length === 0 && !req.file) { 
      throw new UnprocessableEntityError("No data provided for update");
    }

    // Check authentication
    if (!req.user) {
      throw new UnauthorizedError("Unauthorized access");
    }

    const parentId = req.user;
    const { first_name, last_name, phone_number, country, gender } = req.body;

    const updatedParent = await AuthService.editProfile(
      parentId,
      { first_name, last_name, phone_number, country, gender },
      req.file
    );

    res.status(status_codes.HTTP_200_OK).json({
      status: 200,
      success: true,
      message: "Profile updated successfully",
      data: updatedParent
    });
    return
  });

  static async createKidProfile(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    await AuthService.CreateKidProfile(req, res);
  }

  static async loginKid(req: Request, res: Response, next: NextFunction) {
    await AuthService.LoginKid(req, res);
  }

  static async fetchParent(req: Request, res: Response, next: NextFunction) {
    await AuthService.FetchParent(req, res);
  }

  static fetchKid = asyncHandler(async (req: Request, res: Response) => {

    const user = await check_if_user_exists(req.user)

    if (!user) {
      throw new UnauthorizedError("Unauthorized access")
    }

    const { id } = req.params;

    if (!id) {
      throw new BadRequestError("Kid ID is required");
    }

    const kid = await AuthService.fetchKid(id);

   
    res.status(status_codes.HTTP_200_OK).json({
      status: 200,
      success: true,
      data: kid,
    });
    return;
  })


  static async fetchKidsForSingleParent(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    await AuthService.FetchKidsForSingleParent(req, res);
  }

  static async deleteKidProfile(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    await AuthService.DeleteKidProfile(req, res);
  }

  static async deleteParentProfile(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    await AuthService.DeleteParent(req, res);
  }

    static registerAdmin = asyncHandler(
      async (req: Request, res: Response) => {
        const { fullName, email, password } = req.body;
        const missingFields = [];
              if (!email) missingFields.push('email');
              if (!password) missingFields.push('password');
              if (!fullName) missingFields.push('fullName');
      
              if (missingFields.length > 0) {
                  throw new BadRequestError(`Missing required fields: ${missingFields.join(', ')}`);
              }
        const admin = await AuthService.SignUpAdmin(fullName, email, password);
        res.status(status_codes.HTTP_201_CREATED).json({
          status: 201,
          success: true,
          message: "Admin registered successfully!",
          data: admin,
        });
        return;
      }
    );

  static loginAdmin = asyncHandler(async (req: Request, res: Response) => {
    const { email, password, fcmToken } = req.body;
   
           const missingFields = [];
           if (!email) missingFields.push('email');
           if (!password) missingFields.push('password'); 
   
           if (missingFields.length > 0) {
               throw new BadRequestError(`Missing required fields: ${missingFields.join(', ')}`);
           }
    const result = await AuthService.LoginAdmin(email, password, fcmToken)
    res.status(status_codes.HTTP_200_OK).json({
      status: 200,
      success: true,
      data: result,
    });
    return;
  })

  static fetchTotalUsers = asyncHandler(async (req: Request, res: Response) => {
    const admin = Admin.findById(req.user)
    
    if (!admin) {
      throw new UnauthorizedError("Unauthorized access")
    }

    const totalUsers = await AuthService.FetchTotalNumberOfUsers()
    res.status(status_codes.HTTP_200_OK).json({
      status: 200,
      success: true,
      data: totalUsers,
    });
    return;
  })
 
  static fetchTotalNumberOfKids = asyncHandler(async (req: Request, res: Response) => {
    const admin = Admin.findById(req.user)
    
    if (!admin) {
      throw new UnauthorizedError("Unauthorized access")
    }

    const totalKids = await AuthService.FetchTotalNumberOfKids()
    res.status(status_codes.HTTP_200_OK).json({
      status: 200,
      success: true,
      data: totalKids,
    });
    return;
  })

  static fetchTotalParents = asyncHandler(async (req: Request, res: Response) => {
    const admin = Admin.findById(req.user)
    
    if (!admin) {
      throw new UnauthorizedError("Unauthorized access")
    }

    const totalParents = await AuthService.FetchTotalNumberOfParents()
    res.status(status_codes.HTTP_200_OK).json({
      status: 200,
      success: true,
      data: totalParents,
    });
    return;
  })

  static fetchGenderStatistics = asyncHandler(
    async (req: Request, res: Response) => {

      const admin = Admin.findById(req.user)

      if (!admin) {
        throw new UnauthorizedError("Unauthorized access")
      }

      const genderStats = await AuthService.getGenderStatistics()

      res.status(status_codes.HTTP_200_OK).json({
        status: 200,
        success: true,
        data: genderStats,
      });
      return;
    }
  );

  static fetchParents = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const admin = await Admin.findById(req.user);

      if (!admin) {
        throw new UnauthorizedError("Unauthorized access");
      }

      const { page, limit } = req.query;

      const parsedPage = parseInt(page as string) || 1;
      const parsedLimit = parseInt(limit as string) || 10;

      const parents = await AuthService.fetchParents(parsedPage, parsedLimit);

      res.status(status_codes.HTTP_200_OK).json({
        status: 200,
        success: true,
        data: parents,
      });
      return;
    }
  );

  static fetchKidsForParent = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const admin = await Admin.findById(req.user);

      if (!admin) {
        throw new UnauthorizedError("Unauthorized access");
      }

      const { parentId } = req.params;

      if (!parentId) {
        throw new BadRequestError("Parent Id is required")
      }

      const kids = await AuthService.fetchKidsForParent(parentId)
      
      res.status(status_codes.HTTP_200_OK).json({
        status: 200,
        success: true,
        data: kids,
      });
      return;

     }
  )

  static registerBiometricKey = asyncHandler(
    async (req: Request, res: Response) => {
      const { userId, biometricKey } = req.body;

      if (!userId || !biometricKey) {
        throw new BadRequestError("Kid ID and biometric key are required");
      }

      const result = await AuthService.registerBiometric(userId, biometricKey);

      res.status(status_codes.HTTP_200_OK).json({
        status: 200,
        success: result.success,
        message: result.message
      });
      return;
    })
  
  static VerifyBiometricKey = asyncHandler(
    async (req: Request, res: Response) => {
      const { userId, challenge, signature } = req.body;

      if (!userId || !challenge || !signature) {
        throw new BadRequestError("User ID and biometric key are required");
      }

      const isVerified = await AuthService.verifyBiometric(userId, challenge, signature);

      res.status(status_codes.HTTP_200_OK).json({
        status: 200,
        success: true,
        message: isVerified ? "Biometric key verified successfully" : "Biometric key verification failed",
      });
      return;
    }
  )
}

export default UserController;
