import { NextFunction, Request, Response } from "express";
import { AuthService } from "./user.service.js";
import asyncHandler from "express-async-handler";
import { BadRequestError, UnauthorizedError } from "../../models/errors.js";
import { status_codes } from "../../utils/status_constants.js";
import { ifError } from "assert";
import { Admin } from "./user.model.js";

class UserController {
  static async registerParent(req: Request, res: Response, next: NextFunction) {
    await AuthService.RegisterParent(req, res);
  }

  static async verifyEmail(req: Request, res: Response, next: NextFunction) {
    await AuthService.VerifyEmail(req, res);
  }

  static async resendOTP(req: Request, res: Response, next: NextFunction) {
    await AuthService.ResendOTP(req, res);
  }

  static async logout(req: Request, res: Response, next: NextFunction) {
    await AuthService.Logout(req, res);
  }

  static async login(req: Request, res: Response, next: NextFunction) {
    await AuthService.Login(req, res);
  }

  static async refreshToken(req: Request, res: Response, next: NextFunction) {
    await AuthService.RefreshToken(req, res);
  }

  static async forgotPassword(req: Request, res: Response, next: NextFunction) {
    await AuthService.ForgotPassword(req, res);
  }

  static async resetPassword(req: Request, res: Response, next: NextFunction) {
    await AuthService.ResetPassword(req, res);
  }

  static async editProfile(req: Request, res: Response, next: NextFunction) {
    await AuthService.EditProfile(req, res);
  }

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

  static async fetchKid(req: Request, res: Response, next: NextFunction) {
    await AuthService.FetchKid(req, res);
  }

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
 
  static fetchTotalKids = asyncHandler(async (req: Request, res: Response) => {
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

}

export default UserController;
