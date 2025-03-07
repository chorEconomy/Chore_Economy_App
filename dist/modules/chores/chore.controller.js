import ChoreService from "./chore.services.js";
import { Kid, User } from "../users/user.model.js";
import { status_codes } from "../../utils/status_constants.js";
import { EChoreStatus } from "../../models/enums.js";
class ChoreController {
    static async createChore(req, res, next) {
        await ChoreService.createChore(req, res);
    }
    static async fetchAllChoresCreatedByParentForKid(req, res, next) {
        try {
            const kid = await Kid.findById(req.user);
            if (!kid) {
                res.status(status_codes.HTTP_401_UNAUTHORIZED).json({
                    status: 401,
                    success: false,
                    message: "Unauthorized access",
                });
                return;
            }
            const { parentId } = req.params;
            const { page = "1", limit = "10" } = req.query;
            const parsedPage = Number(page);
            const parsedLimit = Number(limit);
            const data = await ChoreService.fetchChoresByStatusFromDBForKid(kid, parentId, parsedPage, parsedLimit);
            res.status(status_codes.HTTP_200_OK).json({
                status: 200,
                success: true,
                message: `All chores fetched successfully`,
                data,
            });
            return;
        }
        catch (error) {
            res.status(status_codes.HTTP_500_INTERNAL_SERVER_ERROR).json({
                success: false,
                status: 500,
                message: error.message || "An unexpected error occurred",
            });
            return;
        }
    }
    static async fetchChoresByStatus(req, res, next) {
        try {
            let user = (await User.findById(req.user)) || (await Kid.findById(req.user));
            if (!user) {
                res.status(status_codes.HTTP_401_UNAUTHORIZED).json({
                    status: status_codes.HTTP_401_UNAUTHORIZED,
                    success: false,
                    message: "Unauthorized access",
                });
                return;
            }
            let status = req.query.status;
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
            let chores = null;
            chores = await ChoreService.fetchChoresByStatusFromDB(user, status, parsedPage, parsedLimit);
            if (status === EChoreStatus.All) {
                chores = await ChoreService.fetchAllChoresFromDB(user, parsedPage, parsedLimit);
            }
            res.status(status_codes.HTTP_200_OK).json({
                status: 200,
                success: true,
                message: `${status} chores fetched successfully`,
                data: chores,
            });
            return;
        }
        catch (error) {
            res.status(status_codes.HTTP_500_INTERNAL_SERVER_ERROR).json({
                success: false,
                status: 500,
                message: error.message || "An unexpected error occurred",
            });
            return;
        }
    }
    static async fetchChore(req, res, next) {
        await ChoreService.fetchChore(req, res);
    }
    static async completeChore(req, res, next) {
        await ChoreService.completeChore(req, res);
    }
    static async approveChoreReward(req, res, next) {
        await ChoreService.approveChoreReward(req, res);
    }
    static async takeChore(req, res, next) {
        await ChoreService.takeChore(req, res);
    }
    static async denyChore(req, res, next) {
        await ChoreService.denyChore(req, res);
    }
}
export default ChoreController;
