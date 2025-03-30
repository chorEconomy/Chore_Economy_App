import { Schema, model } from "mongoose";
import { EChoreStatus } from "../../models/enums.js";
import mongoose from "mongoose";
const choreSchema = new Schema({
    parentId: { type: mongoose.Schema.Types.ObjectId, ref: "Parent", required: true }, // Links the task to a parent
    kidId: { type: mongoose.Schema.Types.ObjectId, ref: "Kid", default: null }, // Links the task to a kid
    photo: { type: String, default: null },
    title: { type: String, required: [true, 'Title is a required field'], trim: true },
    description: { type: String, required: [true, 'Description is a required field'], trim: true },
    earn: { type: Number, required: [true, 'Earn is a required field'], default: 0 },
    isRewardApproved: { type: Boolean, default: false },
    denialReason: { type: String, default: null },
    completedPhotos: { type: [String], default: null },
    completedDate: { type: String, default: null },
    status: { type: String, enum: Object.values(EChoreStatus), required: true, default: EChoreStatus.Unclaimed },
    dueDate: { type: Date, default: null },
}, { timestamps: true });
export const Chore = model("Chore", choreSchema);
