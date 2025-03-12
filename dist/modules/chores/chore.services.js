import { uploadMultipleFiles, uploadSingleFile } from "../../utils/file_upload.utils.js";
import { Chore } from "./chore.model.js";
import { status_codes } from "../../utils/status_constants.js";
import { Kid, User } from "../users/user.model.js";
import { EChoreStatus, ERole } from "../../models/enums.js";
import sendNotification from "../../utils/notifications.js";
import paginate from "../../utils/paginate.js";
import toTitleCase from "../../utils/string_formatter.js";
class ChoreService {
    static async createChore(req, res) {
        try {
            if (!req.body) {
                return res.status(status_codes.HTTP_422_UNPROCESSABLE_ENTITY).json({
                    status: 422,
                    success: false,
                    message: "Unprocessable request body",
                });
            }
            if (!req.user) {
                return res.status(status_codes.HTTP_401_UNAUTHORIZED).json({
                    status: 401,
                    success: false,
                    message: "Unauthorized access",
                });
            }
            const { title, description, earn, dueDate } = req.body;
            const parentId = req.user;
            const existingParent = await User.findById({ _id: parentId });
            if (!existingParent) {
                return res.status(status_codes.HTTP_404_NOT_FOUND).json({ status: 404, success: false, message: `Parent with the id: ${parentId} not found` });
            }
            let choreImageUrl = null;
            if (req.file) {
                const result = await uploadSingleFile(req.file);
                choreImageUrl = result?.secure_url || null;
            }
            const newChore = await new Chore({
                parentId,
                title,
                description,
                earn,
                dueDate,
                photo: choreImageUrl,
            });
            await newChore.save();
            await sendNotification(existingParent.fcmToken, "Task Created", "You've successfully created a new task");
            return res
                .status(status_codes.HTTP_200_OK)
                .json({
                status: 200,
                success: true,
                data: newChore,
                message: "Chore created successfully and notification sent!",
            });
        }
        catch (error) {
            console.error("Chore creation error:", error);
            return res.status(status_codes.HTTP_500_INTERNAL_SERVER_ERROR).json({
                status: 500,
                success: false,
                message: "Internal server error",
                error: error?.message,
            });
        }
    }
    static async fetchAllChoresFromDB(user, owner, page, limit) {
        const filter = {};
        if (user.role === ERole.Parent) {
            filter.parentId = user._id;
        }
        else if (user.role === ERole.Kid && owner !== "parent") {
            filter.kidId = user._id;
        }
        else if (user.role === ERole.Kid && owner === "parent") {
            filter.parentId = user.parentId;
        }
        else {
            throw new Error("Invalid Role");
        }
        return await paginate(Chore, page, limit, "", filter);
    }
    static async fetchChoresByStatusFromDB(user, status, page, limit) {
        const filter = { status: status };
        if (user.role === ERole.Parent) {
            filter.parentId = user._id;
        }
        else if (user.role === ERole.Kid) {
            filter.kidId = user._id;
        }
        else {
            throw new Error("Invalid Role");
        }
        return await paginate(Chore, page, limit, "", filter);
    }
    static async fetchChoresByStatusFromDBForKid(kid, status, owner, page, limit) {
        const filter = { status: status };
        if (kid.role === ERole.Kid) {
            filter.parentId = kid.parentId;
            console.log("parentId", kid.parentId);
        }
        else {
            throw new Error("Invalid Role");
        }
        return await paginate(Chore, page, limit, "", filter);
    }
    static async fetchChore(user, choreId) {
        let filter = { _id: choreId };
        if (user.role === ERole.Parent) {
            filter.parentId = user._id;
        }
        else if (user.role !== ERole.Kid) {
            throw new Error("Invalid Role");
        }
        const chore = await Chore.findOne(filter);
        return chore;
    }
    static async approveChoreReward(req, res) {
        try {
            if (!req.user) {
                return res.status(status_codes.HTTP_401_UNAUTHORIZED).json({
                    status: 401,
                    success: false,
                    message: "Unauthorized access",
                });
            }
            const { id } = req.params;
            if (!id) {
                return res.status(status_codes.HTTP_400_BAD_REQUEST).json({ status: 400, success: false, message: "Provide a valid id!" });
            }
            const parentId = req.user;
            const existingParent = await User.findById({ _id: parentId });
            if (!existingParent) {
                return res.status(status_codes.HTTP_404_NOT_FOUND).json({ status: 404, success: false, message: `Parent with the id: ${parentId} not found` });
            }
            const existingChore = await Chore.findOne({ _id: id, parentId: parentId });
            if (!existingChore) {
                return res.status(status_codes.HTTP_404_NOT_FOUND).json({ status: 404, success: false, messgae: `Chore with this id: ${id} not found!` });
            }
            if (existingChore.status != EChoreStatus.Pending) {
                return res.status(status_codes.HTTP_403_FORBIDDEN).json({ status: 404, success: false, messgae: `Chore has not been completed yet!` });
            }
            const kid = await Kid.findById(existingChore.kidId);
            if (!kid) {
                return res.status(status_codes.HTTP_404_NOT_FOUND).json({ status: 404, success: false, messgae: `Kid with this id: ${id} not found!` });
            }
            existingChore.isRewardApproved = true;
            existingChore.status = EChoreStatus.Completed;
            existingChore.save();
            await sendNotification(kid.fcmToken, "Chore Reviewed!", "Your parent has approved your completed chore. Great job!");
            return res
                .status(status_codes.HTTP_200_OK)
                .json({
                status: 200,
                success: true,
                data: existingChore,
                message: "Reward approved successfully",
            });
        }
        catch (error) {
            console.error("Chore fetching error:", error);
            return res.status(status_codes.HTTP_500_INTERNAL_SERVER_ERROR).json({
                status: 500,
                success: false,
                message: "Internal server error",
                error: error?.message,
            });
        }
    }
    static async takeChore(req, res) {
        try {
            const kid = await Kid.findById(req.user);
            if (!kid) {
                return res.status(status_codes.HTTP_401_UNAUTHORIZED).json({
                    status: 401,
                    success: false,
                    message: "Unauthorized access",
                });
            }
            const choreId = req.params.id;
            const existingChore = await Chore.findById(choreId);
            if (!existingChore) {
                return res.status(status_codes.HTTP_404_NOT_FOUND).json({ status: 404, success: false, messgae: `Chore with this id: ${choreId} not found!` });
            }

             if (existingChore.status === EChoreStatus.InProgress) {
                 return res.status(status_codes.HTTP_400_BAD_REQUEST).json({ status: 400, success: false, message: `Chore has been taken!` })
            }
                    
            existingChore.status = EChoreStatus.InProgress;
            existingChore.kidId = req.user;
            await existingChore.save();
            return res
                .status(status_codes.HTTP_200_OK)
                .json({
                status: 200,
                success: true,
                data: existingChore,
                message: "Chore taken successfully",
            });
        }
        catch (error) {
            console.error("Chore fetching error:", error);
            return res.status(status_codes.HTTP_500_INTERNAL_SERVER_ERROR).json({
                status: 500,
                success: false,
                message: "Internal server error",
                error: error?.message,
            });
        }
    }
    static async completeChore(req, res) {
        try {
            const kid = await Kid.findById(req.user);
            if (!kid) {
                return res.status(status_codes.HTTP_401_UNAUTHORIZED).json({
                    status: 401,
                    success: false,
                    message: "Unauthorized access",
                });
            }
            const choreId = req.params.id;
            // Find the existing chore
            const existingChore = await Chore.findOne({ _id: choreId, kidId: kid._id });
            if (!existingChore) {
                return res.status(status_codes.HTTP_404_NOT_FOUND).json({
                    status: 404,
                    success: false,
                    message: `Chore not found!`,
                });
            }
            if (existingChore.kidId.toString() !== req.user) {
                return res.status(status_codes.HTTP_403_FORBIDDEN).json({
                    status: 403,
                    success: false,
                    message: "You are not allowed to complete this chore",
                });
            }
            // Upload images if available
            let choreImages = [];
            if (req.files) {
                const result = await uploadMultipleFiles(req.files);
                choreImages = result.map(res => res.secure_url);
            }
            // Update chore details
            existingChore.completedPhotos = choreImages;
            existingChore.status = EChoreStatus.Pending;
            const currentDate = new Date();
            const formattedDate = `${currentDate.getDate()}/${currentDate.getMonth() + 1}/${currentDate.getFullYear()}`;
            existingChore.completedDate = formattedDate;
            await existingChore.save();
            const parent = await User.findById(existingChore.parentId);
            if (!parent) {
                return res.status(status_codes.HTTP_404_NOT_FOUND).json({
                    status: 404,
                    success: false,
                    message: `Parent with this ID: ${choreId} not found!`,
                });
            }
            await sendNotification(parent.fcmToken, kid.name, `${toTitleCase(existingChore.title)}\nCompleted on ${existingChore.completedDate}`);
            return res.status(status_codes.HTTP_200_OK).json({
                status: 200,
                success: true,
                message: "Chore completed successfully",
                data: existingChore, // Optionally return updated chore
            });
        }
        catch (error) {
            console.error("Chore completing error:", error);
            return res.status(status_codes.HTTP_500_INTERNAL_SERVER_ERROR).json({
                status: 500,
                success: false,
                message: "Internal server error",
                error: error?.message,
            });
        }
    }
    static async denyChore(req, res) {
        try {
            const parentId = req.user;
            if (!parentId) {
                return res.status(status_codes.HTTP_401_UNAUTHORIZED).json({
                    status: 401,
                    success: false,
                    message: "Unauthorized access",
                });
            }
            const { id } = req.params;
            const { reason } = req.body;
            const chore = await Chore.findOne({ _id: id, parentId: parentId });
            if (!chore) {
                return res.status(status_codes.HTTP_404_NOT_FOUND).json({
                    status: 404,
                    success: false,
                    message: "Chore not found",
                });
            }
            if (chore.parentId.toString() !== parentId) {
                return res.status(status_codes.HTTP_403_FORBIDDEN).json({
                    status: 403,
                    success: false,
                    message: "You are not allowed to deny this chore",
                });
            }
            chore.denialReason = reason || "No reason provided";
            chore.status = EChoreStatus.Rejected;
            await chore.save();
            const kid = await Kid.findById(chore.kidId);
            if (!kid) {
                return res.status(status_codes.HTTP_404_NOT_FOUND).json({ status: 404, success: false, messgae: `Kid with this id: ${id} not found!` });
            }
            await sendNotification(kid.fcmToken, "Chore Rejected", "Your parent has denied your completed chore. Please review and try again.");
            return res.status(status_codes.HTTP_200_OK).json({
                status: 200,
                success: true,
                message: "Chore has been denied",
                data: {
                    choreId: chore._id,
                    status: chore.status,
                    denialReason: chore.denialReason,
                },
            });
        }
        catch (error) {
            console.error("Error denying chore:", error);
            return res.status(status_codes.HTTP_500_INTERNAL_SERVER_ERROR).json({
                status: 500,
                success: false,
                message: "Internal Server Error",
                error: error?.message,
            });
        }
    }
}
export default ChoreService;
