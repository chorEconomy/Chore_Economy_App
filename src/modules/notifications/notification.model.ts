import { Schema, model, ObjectId, Document } from "mongoose"; 
import mongoose from "mongoose";

interface INotification extends Document {
    recipient: {
        id: ObjectId
        role: string
    }
    recipientId: ObjectId
    title: string
    message: string
    read: boolean
    readAt: Date | null
}

const notificationSchema: Schema = new Schema<INotification>({
    recipient: {
        id: { type: Schema.Types.ObjectId, required: true },
        role: {
          type: String,
          required: true,
          enum: ['Parent', 'Kid', 'Admin']
        }
      },
      recipientId: {
        type: Schema.Types.ObjectId,
        required: true,
        refPath: 'recipient.role'
      },
    title: { type: String, required: [true, 'Title is a required field'], trim: true },
    message: { type: String, required: [true, 'Message is a required field'], trim: true },
    read: { type: Boolean, default: false },
    readAt: { type: Date, default: null },
},
    { timestamps: true }
);

export const Notification = model<INotification>("Notification", notificationSchema)