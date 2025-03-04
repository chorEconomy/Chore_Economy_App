import { NextFunction, Request, Response } from "express";
import { AuthService } from "./user.service";
 


class UserController {
  static async registerParent(req: Request, res: Response, next: NextFunction) {
     await AuthService.RegisterParent(req, res)
  }

  static async verifyEmail(req: Request, res: Response, next: NextFunction) {
     await AuthService.VerifyEmail(req, res)
}  

static async resendOTP(req: Request, res: Response, next: NextFunction) {
 await AuthService.ResendOTP(req, res)
}

  
static async logout(req: Request, res: Response, next: NextFunction) {
    await AuthService.Logout(req, res)
}

static async login(req: Request, res: Response, next: NextFunction) {
  await AuthService.Login(req, res)
}


static async refreshToken(req: Request, res: Response, next: NextFunction) {
    await AuthService.RefreshToken(req, res)
}


static async forgotPassword(req: Request, res: Response, next: NextFunction) {
 await AuthService.ForgotPassword(req, res)
}

static async resetPassword(req: Request, res: Response, next: NextFunction) { 
  await AuthService.ResetPassword(req, res);
  }

  static async editProfile(req: Request, res: Response, next: NextFunction) { 
  await AuthService.EditProfile(req, res);
  }

  static async createKidProfile(req: Request, res: Response, next: NextFunction) { 
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
 
  static async fetchKidsForSingleParent(req: Request, res: Response, next: NextFunction) { 
  await AuthService.FetchKidsForSingleParent(req, res);
  }
 
  static async deleteKidProfile(req: Request, res: Response, next: NextFunction) { 
  await AuthService.DeleteKidProfile(req, res);
  }
 
  static async deleteParentProfile(req: Request, res: Response, next: NextFunction) { 
  await AuthService.DeleteParent(req, res);
  }
}


export default UserController;

