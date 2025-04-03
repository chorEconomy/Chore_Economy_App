import { Schema, model, ObjectId, Document } from "mongoose"; 
import mongoose from "mongoose";

interface INotification extends Document {
    parentId: ObjectId
    kidId: ObjectId
    message: string
    title: string
}

const notificationSchema: Schema = new Schema<INotification>({
    parentId: { type: mongoose.Schema.Types.ObjectId, ref: "Parent", default: null},
    kidId: { type: mongoose.Schema.Types.ObjectId, ref: "Kid", default: null },
    title: { type: String, required: [true, 'Title is a required field'], trim: true},
    message: { type: String, required: [true, 'Message is a required field'], trim: true },
},
    { timestamps: true }
);

export const Notification = model<INotification>("Notification", notificationSchema)