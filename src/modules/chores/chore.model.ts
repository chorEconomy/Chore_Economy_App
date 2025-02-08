import { Schema, model, ObjectId, Document } from "mongoose"; 
import { EChoreStatus } from "../../models/enums";
const mongoose = require("mongoose")

interface IChore extends Document {
    parentId: ObjectId
    kidId: ObjectId
    photo: string
    title: string
    description: string
    earn: number
    isRewardApproved: boolean
    status: EChoreStatus
    dueDate: Date
}

const choreSchema: Schema = new Schema<IChore>({
    parentId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // Links the task to a parent
    kidId: { type: mongoose.Schema.Types.ObjectId, ref: "Kid", default: null }, // Links the task to a kid
    photo: { type: String, default: null },
    title: { type: String, required: [true, 'Title is a required field'], trim: true},
    description: { type: String, required: [true, 'Description is a required field'], trim: true },
    earn: { type: Number, required: [true, 'Earn is a required field'], default: 0 },
    isRewardApproved: {type: Boolean, default: false},
    status: { type: String, enum: Object.values(EChoreStatus), required: true, default: EChoreStatus.Unclaimed},
    dueDate: { type: Date, default: null },
},
    { timestamps: true }
);

export const Chore = model<IChore>("Chore", choreSchema)