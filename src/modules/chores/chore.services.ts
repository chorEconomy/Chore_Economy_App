import { Request, Response } from "express";
import {
  uploadMultipleFiles,
  uploadSingleFile,
} from "../../utils/file_upload.utils.js";
import { Chore } from "./chore.model.js";
import { status_codes } from "../../utils/status_constants.js";
import { Kid, Parent } from "../users/user.model.js";
import { EChoreStatus, ERole, EStatus } from "../../models/enums.js";
import sendNotification from "../../utils/notifications.js";
import paginate from "../../utils/paginate.js";
import toTitleCase from "../../utils/string_formatter.js";
import { BadRequestError, NotFoundError } from "../../models/errors.js";
import { Notification } from "../notifications/notification.model.js";

class ChoreService {
  static async createChore(parent: any, body: any, file: any) {
    const { title, description, earn, dueDate } = body;

    let choreImageUrl: string | null = null;

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

    await sendNotification(
      parent.fcmToken,
      "New Chore Created",
      "You've successfully created a new task"
    );

    const notification = await new Notification({
      parentId: parent._id, 
      title: "New Chore Created",
      message: `You've successfully created a new task`,
    });

    await notification.save();

    return newChore;
  }

  static async fetchAllChoresFromDB(
    user: any,
    owner: string,
    page: number,
    limit: number
  ) {
    const filter: any = {};

    if (user.role === ERole.Parent) {
      filter.parentId = user._id;
    } else if (user.role === ERole.Kid && owner !== "parent") {
      filter.kidId = user._id;
    } else if (user.role === ERole.Kid && owner === "parent") {
      filter.parentId = user.parentId;
    } else {
      throw new Error("Invalid Role");
    }

    return await paginate(Chore, page, limit, "", filter);
  }

  static async fetchChoresByStatusFromDB(
    user: any,
    status: string,
    page: number,
    limit: number
  ) {
    const filter: any = { status: status };

    if (user.role === ERole.Parent) {
      filter.parentId = user._id;
    } else if (user.role === ERole.Kid) {
      filter.kidId = user._id;
    } else {
      throw new Error("Invalid Role");
    }
    return await paginate(Chore, page, limit, "", filter);
  }

  static async fetchChoresByStatusFromDBForKid(
    kid: any,
    status: string,
    owner: string,
    page: number,
    limit: number
  ) {
    const filter: any = { status: status };

    if (kid.role === ERole.Kid) {
      filter.parentId = kid.parentId;
      console.log("parentId", kid.parentId);
    } else {
      throw new Error("Invalid Role");
    }
    return await paginate(Chore, page, limit, "", filter);
  }

  static async fetchChore(user: any, choreId: any) {
    let filter: any = { _id: choreId };
    if (user.role === ERole.Parent) {
      filter.parentId = user._id;
    } else if (user.role !== ERole.Kid) {
      throw new Error("Invalid Role");
    }
    const chore = await Chore.findOne(filter);
    return chore;
  }

  static async approveChore(parent: any, id: any) {
    const chore: any = await Chore.findOne({ _id: id, parentId: parent._id });
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

    await sendNotification(
      kid.fcmToken,
      "Chore Approved!",
      "Your parent has approved your completed chore. Great job!"
    );

    const notification = await new Notification({
      kidId: kid._id,
      title: "Chore Approved!",
      message: "Your parent has approved your completed chore. Great job!",
    });
    await notification.save();

    return chore;
  }

  static async takeChore(kid: any, choreId: any) {
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

  static async completeChore(kid: any, choreId: any, files: any) {
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

    let choreImages: string[] = [];
    if (files) {
      const result = await uploadMultipleFiles(files);
      choreImages = result.map((res) => res.secure_url);
    }

    chore.completedPhotos = choreImages;

    chore.status = EChoreStatus.Pending;

    const currentDate = new Date();

    const formattedDate = `${currentDate.getDate()}/${
      currentDate.getMonth() + 1
    }/${currentDate.getFullYear()}`;

    chore.completedDate = formattedDate;

    await chore.save();

    const parent = await Parent.findById(chore.parentId);

    if (!parent) {
      throw new NotFoundError("Kid's parent not found");
    }

    await sendNotification(
      parent.fcmToken,
      "Chore submitted",
      `${toTitleCase(chore.title)} submitted on ${chore.completedDate}`
    );

    const notification = await new Notification({
      parentId: parent._id,
      title: `Chore submitted`,
      message: `${toTitleCase(chore.title)} submitted on ${
        chore.completedDate
      }`,
    });

    await notification.save();

    return chore;
  }

  static async denyChore(parent: any, choreId: any, reason: string) {
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

    await sendNotification(
      kid.fcmToken,
      "Chore Rejected",
      "Your parent has rejected your completed chore. Please review and try again."
    );

    const notification = await new Notification({
      kidId: kid._id,
      title: "Chore Rejected",
      message:
        "Your parent has rejected your completed chore. Please review and try again.",
    });

    await notification.save();

    return chore;
  }

  static async fetchChoresStatistics() {
    const totalChores = await Chore.countDocuments();
    const unclaimed = await Chore.countDocuments({
      status: EChoreStatus.Unclaimed,
    });
    const completed = await Chore.countDocuments({
      status: EChoreStatus.Completed,
    });
    const inProgress = await Chore.countDocuments({
      status: EChoreStatus.InProgress,
    });

    const unclaimedPercentage = (unclaimed / totalChores) * 100;
    const completedPercentage = (completed / totalChores) * 100;
    const inProgressPercentage = (inProgress / totalChores) * 100;

    return {
      totalChores: totalChores,
      unclaimed: unclaimedPercentage,
      completed: completedPercentage,
      inProgress: inProgressPercentage,
    };
  }

  static async fetchChoreDetailsForParent(parentId: any) {
    const chores = await Chore.find({ parentId: parentId })
      .where("status")
      .ne(EChoreStatus.Unclaimed)
      .select("title kidId dueDate createdAt earn status")
      .populate("kidId")
      .select("name")
      .lean();
    return chores;
  }
}

export default ChoreService;
