import { Schema, model } from "mongoose";
import mongoose from "mongoose";
const notificationSchema = new Schema({
    parentId: { type: mongoose.Schema.Types.ObjectId, ref: "Parent", default: null },
    kidId: { type: mongoose.Schema.Types.ObjectId, ref: "Kid", default: null },
    title: { type: String, required: [true, 'Title is a required field'], trim: true },
    message: { type: String, required: [true, 'Message is a required field'], trim: true },
}, { timestamps: true });
export const Notification = model("Notification", notificationSchema);
