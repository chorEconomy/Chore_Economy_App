import { Schema, model } from "mongoose";
const notificationSchema = new Schema({
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
}, { timestamps: true });
export const Notification = model("Notification", notificationSchema);
