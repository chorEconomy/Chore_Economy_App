import { NextFunction, Request, Response } from "express";
import ChoreService from "./chore.services";
import AuthenticatedRequest from "../../models/AuthenticatedUser";
import { Kid, User } from "../users/user.model";
import { ERole } from "../../models/enums";
import status_codes from "../../utils/status_constants";

class ChoreController {
  static async createChore(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) {
    return ChoreService.createChore(req, res);
  }

  static async fetchAllChores(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      const user =
            (await User.findById(req.user)) || (await Kid.findById(req.user));
        
      if (!user) {
        return res.status(status_codes.HTTP_401_UNAUTHORIZED).json({
          status: 401,
          success: false,
          message: "Unauthorized access",
        });
        }

        const { page = "1", limit = "10" } = req.query
        const parsedPage = Number(page)
        const parsedLimit = Number(limit)
        
        const chores = ChoreService.fetchAllChoresFromDB(user, parsedPage, parsedLimit);
        
       return res.status(status_codes.HTTP_200_OK).json({
        status: 200,
        success: true,
        message: `Chores fetched successfully`,
        data: chores,
      });
    } catch (error: any) {
      return res.status(status_codes.HTTP_500_INTERNAL_SERVER_ERROR).json({
        success: false,
        status: 500,
        message: error.message || "An unexpected error occurred",
      });
    }
  }

  static async fetchChoresByStatus(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      let user =
        (await User.findById(req.user)) || (await Kid.findById(req.user));
      if (!user) {
        return res.status(status_codes.HTTP_401_UNAUTHORIZED).json({
          status: status_codes.HTTP_401_UNAUTHORIZED,
          success: false,
          message: "Unauthorized access",
        });
      }

      const { status, page = "1", limit = "10" } = req.query;

      if (!status) {
        return res.status(status_codes.HTTP_400_BAD_REQUEST).json({
          status: 400,
          success: true,
          message: "Please provide a valid chore status",
        });
      }
      const parsedPage = Number(page);
      const parsedLimit = Number(limit);

      const chores = await ChoreService.fetchChoresByStatusFromDB(
        user,
        status as string,
        parsedPage,
        parsedLimit
      );

      return res.status(status_codes.HTTP_200_OK).json({
        status: 200,
        success: true,
        message: `${status} chores fetched successfully`,
        data: chores,
      });
    } catch (error: any) {
      return res.status(status_codes.HTTP_500_INTERNAL_SERVER_ERROR).json({
        success: false,
        status: 500,
        message: error.message || "An unexpected error occurred",
      });
    }
  }

  static async fetchChore(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) {
    return ChoreService.fetchChore(req, res);
    }
    
  static async completeChore(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) {
    return ChoreService.completeChore(req, res);
  }

  static async approveChoreReward(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) {
    return ChoreService.approveChoreReward(req, res);
  }

  static async takeChore(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) {
    return ChoreService.takeChore(req, res);
  }

  static async denyChore(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) {
    return ChoreService.denyChore(req, res);
    }
    
















    

  // static async fetchAllChoresForKid(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  //     return ChoreService.fetchAllChoresForKid(req, res);
  // }
  // static async fetchRejectedChores(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  //     return ChoreService.fetchRejectedChores(req, res);
  // }

  // static async fetchCompletedChoresForKid(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  //     return ChoreService.fetchCompletedChoresForKid(req, res);
  // }

  // static async fetchInProgressChores(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  //     return ChoreService.fetchInprogressChores(req, res);
  // }
  // static async fetchCompletedChores(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  //     return ChoreService.fetchCompletedChores(req, res);
  // }

  // static async fetchPendingChoresForKid(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  //     return ChoreService.fetchPendingChoresForKid(req, res);
  // }

  // static async fetchUnclaimedChores(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  //     return ChoreService.fetchUnclaimedChores(req, res);
  // }
}

export default ChoreController;
