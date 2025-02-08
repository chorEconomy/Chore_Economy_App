import { NextFunction, Request, Response } from "express";
import ChoreService from "./chore.services";
import { RequestUser } from "../../models/RequestUser";
import AuthenticatedRequest from "../../models/AuthenticatedUser";


class ChoreController {
    static async create(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        return ChoreService.createChore(req, res);
    }
}

export default ChoreController