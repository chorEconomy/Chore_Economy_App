import mongoose, { Schema, model, ObjectId, Document } from "mongoose";

interface IKidAccount extends Document {
  kidId: ObjectId; // Reference to the Parent (User)
  accountBalance: number
  earnings: number
}

const kidAccountSchema: Schema = new Schema<IKidAccount>({
    kidId: { type: mongoose.Schema.Types.ObjectId, ref: "Kid", required: true },
    accountBalance: {type: Number, required: [true, 'Earn is a required field'], default: 0},
    earnings: { type: Number, required: [true, 'Earn is a required field'], default: 0 },
},
    { timestamps: true }
)


export const KidAccount = model<IKidAccount>("KidAccount", kidAccountSchema)