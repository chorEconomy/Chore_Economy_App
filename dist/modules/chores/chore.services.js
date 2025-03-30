import { uploadMultipleFiles, uploadSingleFile, } from "../../utils/file_upload.utils.js";
import { Chore } from "./chore.model.js";
import { Kid, Parent } from "../users/user.model.js";
import { EChoreStatus, ERole } from "../../models/enums.js";
import sendNotification from "../../utils/notifications.js";
import paginate from "../../utils/paginate.js";
import toTitleCase from "../../utils/string_formatter.js";
import { BadRequestError, NotFoundError } from "../../models/errors.js";
class ChoreService {
    static async createChore(parent, body, file) {
        const { title, description, earn, dueDate } = body;
        let choreImageUrl = null;
        if (file) {
            const result = await uploadSingleFile(file);
            choreImageUrl = result?.secure_url || null;
        }
        const newChore = await new Chore({
            parentId: parent._id,
            title,
            description,
            earn,
            dueDate,
            photo: choreImageUrl,
        });
        await newChore.save();
        await sendNotification(parent.fcmToken, "Task Created", "You've successfully created a new task");
        return newChore;
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
    static async approveChore(parent, id) {
        const chore = await Chore.findOne({ _id: id, parentId: parent._id });
        if (!chore) {
            throw new NotFoundError("Chore not found");
        }
        if (chore.status === EChoreStatus.Approved) {
            throw new BadRequestError("Chore has already been approved!");
        }
        if (chore.status !== EChoreStatus.Pending) {
            throw new BadRequestError("Chore has not been completed yet!");
        }
        const kid = await Kid.findById(chore.kidId);
        if (!kid) {
            throw new NotFoundError("Kid not found");
        }
        chore.isRewardApproved = true;
        chore.status = EChoreStatus.Approved;
        chore.save();
        await sendNotification(kid.fcmToken, "Chore Reviewed!", "Your parent has approved your completed chore. Great job!");
        return chore;
    }
    static async takeChore(kid, choreId) {
        const chore = await Chore.findById(choreId);
        if (!chore) {
            throw new NotFoundError("Chore not found");
        }
        if (chore.status === EChoreStatus.InProgress) {
            throw new BadRequestError("Chore is already taken");
        }
        chore.status = EChoreStatus.InProgress;
        chore.kidId = kid._id;
        await chore.save();
        return chore;
    }
    static async completeChore(kid, choreId, files) {
        const chore = await Chore.findOne({ _id: choreId, kidId: kid._id });
        if (!chore) {
            throw new NotFoundError("Chore not found");
        }
        if (chore.status === EChoreStatus.Pending) {
            throw new BadRequestError("Chore has been completed!");
        }
        if (chore.kidId.toString() !== kid._id.toString()) {
            throw new BadRequestError("You are not allowed to complete this chore");
        }
        let choreImages = [];
        if (files) {
            const result = await uploadMultipleFiles(files);
            choreImages = result.map((res) => res.secure_url);
        }
        chore.completedPhotos = choreImages;
        chore.status = EChoreStatus.Pending;
        const currentDate = new Date();
        const formattedDate = `${currentDate.getDate()}/${currentDate.getMonth() + 1}/${currentDate.getFullYear()}`;
        chore.completedDate = formattedDate;
        await chore.save();
        const parent = await Parent.findById(chore.parentId);
        if (!parent) {
            throw new NotFoundError("Kid's parent not found");
        }
        await sendNotification(parent.fcmToken, kid.name, `${toTitleCase(chore.title)}\nCompleted on ${chore.completedDate}`);
        return chore;
    }
    static async denyChore(parent, choreId, reason) {
        const chore = await Chore.findOne({ _id: choreId, parentId: parent._id });
        if (!chore) {
            throw new NotFoundError("Chore not found");
        }
        if (chore.parentId.toString() !== parent._id.toString()) {
            throw new BadRequestError("You are not allowed to deny this chore");
        }
        chore.denialReason = reason || "No reason provided";
        chore.status = EChoreStatus.Denied;
        await chore.save();
        const kid = await Kid.findById(chore.kidId);
        if (!kid) {
            throw new NotFoundError("Kid not found");
        }
        await sendNotification(kid.fcmToken, "Chore Rejected", "Your parent has rejected your completed chore. Please review and try again.");
        return chore;
    }
    static async fetchChoresStatistics() {
        const totalChores = await Chore.countDocuments();
        const unclaimed = await Chore.countDocuments({ status: EChoreStatus.Unclaimed });
        const completed = await Chore.countDocuments({ status: EChoreStatus.Completed });
        const inProgress = await Chore.countDocuments({ status: EChoreStatus.InProgress });
        const unclaimedPercentage = (unclaimed / totalChores) * 100;
        const completedPercentage = (completed / totalChores) * 100;
        const inProgressPercentage = (inProgress / totalChores) * 100;
        return {
            totalChores: totalChores,
            unclaimed: unclaimedPercentage,
            completed: completedPercentage,
            inProgress: inProgressPercentage
        };
    }
}
export default ChoreService;
