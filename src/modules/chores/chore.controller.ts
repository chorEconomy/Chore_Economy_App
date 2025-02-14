import { NextFunction, Request, Response } from "express";
import ChoreService from "./chore.services";
import { RequestUser } from "../../models/RequestUser";
import AuthenticatedRequest from "../../models/AuthenticatedUser";


class ChoreController {
    static async createChore(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        return ChoreService.createChore(req, res);
    }

    static async fetchAllChores(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        return ChoreService.fetchAllChores(req, res);
    }

    static async fetchCompletedChores(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        return ChoreService.fetchCompletedChores(req, res);
    }
    
    static async fetchInProgressChores(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        return ChoreService.fetchInprogressChores(req, res);
    }

    static async fetchUnclaimedChores(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        return ChoreService.fetchUnclaimedChores(req, res);
    }
   
    static async fetchChore(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        return ChoreService.fetchChore(req, res);
    }

    static async approveChoreReward(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        return ChoreService.approveChoreReward(req, res);
    }
}

export default ChoreController