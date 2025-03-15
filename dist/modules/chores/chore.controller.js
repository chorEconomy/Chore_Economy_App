import ChoreService from "./chore.services.js";
import { Kid, User } from "../users/user.model.js";
import { status_codes } from "../../utils/status_constants.js";
import { EChoreStatus } from "../../models/enums.js";
import asyncHandler from "express-async-handler";
import { BadRequestError, NotFoundError, UnauthorizedError, UnprocessableEntityError, } from "../../models/errors.js";
class ChoreController {
    static createChore = asyncHandler(async (req, res, next) => {
        const parent = await User.findById(req.user);
        if (!parent) {
            throw new UnauthorizedError("Unauthorized access");
        }
        if (!req.body) {
            throw new UnprocessableEntityError("Please provide the required fields");
        }
        const chore = await ChoreService.createChore(parent, req.body, req.file);
        res.status(status_codes.HTTP_200_OK).json({
            status: 200,
            success: true,
            message: `Chore created successfully`,
            data: chore,
        });
        return;
    });
    static fetchChoresByStatus = asyncHandler(async (req, res, next) => {
        let user = (await User.findById(req.user)) || (await Kid.findById(req.user));
        if (!user) {
            throw new UnauthorizedError("Unauthorized access");
        }
        let status = req.query.status;
        let owner = req.query.owner;
        const { page = "1", limit = "10" } = req.query;
        if (!status || !Object.values(EChoreStatus).includes(status)) {
            throw new BadRequestError("Invalid or missing chore status. Please provide a valid status.");
        }
        const parsedPage = Number(page);
        const parsedLimit = Number(limit);
        let chores = null;
        chores = await ChoreService.fetchChoresByStatusFromDB(user, status, parsedPage, parsedLimit);
        if (status === EChoreStatus.All) {
            chores = await ChoreService.fetchAllChoresFromDB(user, owner, parsedPage, parsedLimit);
        }
        res.status(status_codes.HTTP_200_OK).json({
            status: 200,
            success: true,
            message: `${status} chores fetched successfully`,
            data: chores.result,
        });
        return;
    });
    static fetchChore = asyncHandler(async (req, res, next) => {
        let user = (await User.findById(req.user)) || (await Kid.findById(req.user));
        if (!user) {
            throw new UnauthorizedError("Unauthorized access");
        }
        const choreId = req.params.id;
        if (!choreId) {
            throw new BadRequestError("Please provide a valid chore id");
        }
        const chore = await ChoreService.fetchChore(user, choreId);
        if (!chore) {
            throw new NotFoundError("Chore not found");
        }
        res.status(status_codes.HTTP_200_OK).json({
            status: 200,
            success: true,
            message: "Chore retrieved successfully",
            data: chore,
        });
        return;
    });
    static completeChore = asyncHandler(async (req, res, next) => {
        const kid = await Kid.findById(req.user);
        if (!kid) {
            throw new UnauthorizedError("Unauthorized access");
        }
        const choreId = req.params.id;
        if (!choreId) {
            throw new BadRequestError("Please provide a valid chore id");
        }
        const chore = await ChoreService.completeChore(kid, choreId, req.files);
        res.status(status_codes.HTTP_200_OK).json({
            status: 200,
            success: true,
            message: "Chore completed successfully",
            data: chore,
        });
        return;
    });
    static approveChore = asyncHandler(async (req, res, next) => {
        const parent = await User.findById(req.user);
        console.log(parent);
        
        if (!parent) {
            throw new UnauthorizedError("Unauthorized access");
        }
        const { id } = req.params;
        console.log(id);
        if (!id) {
            throw new BadRequestError("Please provide a valid chore id");
        }
        const chore = await ChoreService.approveChore(parent, id);
 
        res.status(status_codes.HTTP_200_OK).json({
            status: 200,
            success: true,
            message: "Chore approved successfully",
            data: chore,
        });
        return;
    });
    static takeChore = asyncHandler(async (req, res, next) => {
        const kid = await Kid.findById(req.user);
        if (!kid) {
            throw new UnauthorizedError("Unauthorized access");
        }
        const choreId = req.params.id;
        const chore = await ChoreService.takeChore(kid, choreId);
        res.status(status_codes.HTTP_200_OK).json({
            status: 200,
            success: true,
            data: chore,
            message: "Chore taken successfully",
        });
        return;
    });
    static denyChore = asyncHandler(async (req, res, next) => {
        const parentId = req.user;
        if (!parentId) {
            throw new UnauthorizedError("Unauthorized access");
        }
        if (!req.body) {
            throw new UnprocessableEntityError("Please provide the required fields");
        }
        const choreId = req.params.id;
        if (!choreId) {
            throw new BadRequestError("Please provide a valid chore id");
        }
        const chore = await ChoreService.denyChore(parent, choreId, req.body.reason);
        res.status(status_codes.HTTP_200_OK).json({
            status: 200,
            success: true,
            message: "Chore has been denied",
            data: {
                choreId: chore._id,
                status: chore.status,
                denialReason: chore.denialReason,
            },
        });
        return;
    });
}
export default ChoreController;
