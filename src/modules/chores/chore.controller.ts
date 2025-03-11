import { NextFunction, Request, Response } from "express";
import ChoreService from "./chore.services.js";
import { Kid, User } from "../users/user.model.js";
import {status_codes} from "../../utils/status_constants.js";
import { EChoreStatus } from "../../models/enums.js";

class ChoreController {
  static async createChore(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    
    await ChoreService.createChore(req, res);
  }


  static async fetchChoresByStatus(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      let user =
        (await User.findById(req.user)) || (await Kid.findById(req.user));
      if (!user) {
         res.status(status_codes.HTTP_401_UNAUTHORIZED).json({
          status: status_codes.HTTP_401_UNAUTHORIZED,
          success: false,
          message: "Unauthorized access",
         });
         return
      }

      let status: any = req.query.status
      let owner: any = req.query.owner
      
      const { page = "1", limit = "10" } = req.query;
    
      if (!status || !Object.values(EChoreStatus).includes(status)) {
        res.status(status_codes.HTTP_400_BAD_REQUEST).json({
            status: 400,
            success: false,
            message: "Invalid or missing chore status. Please provide a valid status.",
        });
        return;
    }

      const parsedPage = Number(page);
      const parsedLimit = Number(limit);

      let chores: any = null

       chores = await ChoreService.fetchChoresByStatusFromDB(
        user,
        status as string,
        parsedPage,
        parsedLimit
      );

      if (status === EChoreStatus.All) {
        chores = await ChoreService.fetchAllChoresFromDB(
          user,
          owner,
          parsedPage,
          parsedLimit
        );
      }

       res.status(status_codes.HTTP_200_OK).json({
        status: 200,
        success: true,
        message: `${status} chores fetched successfully`,
        data: chores.result,
       });
       return
    } catch (error: any) {
       res.status(status_codes.HTTP_500_INTERNAL_SERVER_ERROR).json({
        success: false,
        status: 500,
        message: error.message || "An unexpected error occurred",
       });
       return
    }
  }

  static async fetchChore(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      let user =
      (await User.findById(req.user)) || (await Kid.findById(req.user));
      if (!user) {
        res.status(status_codes.HTTP_401_UNAUTHORIZED).json({ status: 401, success: false, message: "Unauthorized access" })
        return;
      }
      const choreId = req.params.id
      if (!choreId) {
        res.status(status_codes.HTTP_400_BAD_REQUEST).json({
          status: 400,
          success: false,
          message: "Bad Request! Please provide a valid chore id"
        })
        return;
      }
      const chore = await ChoreService.fetchChore(user, choreId)
      if (!chore) {
        res.status(status_codes.HTTP_404_NOT_FOUND).json({
          status: 404,
          success: false,
          message: "Chore not found!"
        })
        return;
      }
      res.status(status_codes.HTTP_200_OK).json({
        status: 200,
        success: true,
        message: "Chore retrieved successfully",
        data: chore
      })
      return;

      } catch (error: any) {
        res.status(status_codes.HTTP_500_INTERNAL_SERVER_ERROR).json({
          success: false,
          status: 500,
          message: error.message || "An unexpected error occurred",
         });
         return
      }
    }
    
  static async completeChore(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
     await ChoreService.completeChore(req, res);
  }

  static async approveChoreReward(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
     await ChoreService.approveChoreReward(req, res);
  }

  static async takeChore(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
     await ChoreService.takeChore(req, res);
  }

  static async denyChore(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
     await ChoreService.denyChore(req, res);
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
