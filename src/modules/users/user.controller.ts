import { NextFunction, Request, Response } from "express";
import AuthService from "./user.service";
import { RequestUser } from "../../models/RequestUser";
import AuthenticatedRequest from "../../models/AuthenticatedUser";
 


class UserController {
  static async registerParent(req: Request, res: Response, next: NextFunction) {
    return AuthService.RegisterParent(req, res)
  }

  static async verifyEmail(req: Request, res: Response, next: NextFunction) {
 return AuthService.VerifyEmail(req, res)
}  

static async resendOTP(req: Request, res: Response, next: NextFunction) {
 return AuthService.ResendOTP(req, res)
}

  
static async logout(req: RequestUser, res: Response, next: NextFunction) {
    return AuthService.Logout(req, res)
}

static async login(req: Request, res: Response, next: NextFunction) {
  return AuthService.Login(req, res)
}


static async refreshToken(req: Request, res: Response, next: NextFunction) {
    return AuthService.RefreshToken(req, res)
}


static async forgotPassword(req: Request, res: Response, next: NextFunction) {
 return AuthService.ForgotPassword(req, res)
}

static async resetPassword(req: Request, res: Response, next: NextFunction) { 
  return AuthService.ResetPassword(req, res);
  }

  static async editProfile(req: AuthenticatedRequest, res: Response, next: NextFunction) { 
  return AuthService.EditProfile(req, res);
  }

  static async createKidProfile(req: AuthenticatedRequest, res: Response, next: NextFunction) { 
  return AuthService.CreateKidProfile(req, res);
  }
}




export default UserController;

