import { Schema, model, ObjectId, Document } from "mongoose";
import { EGender, ERole, EStatus } from "../../models/enums";
const bcrypt = require("bcrypt");
const mongoose = require("mongoose");


 

export interface IUser extends Document {
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  password: string;
  isVerified: boolean;
  gender: EGender;
  photo: string | null;
  phoneNumber: string;
  role: ERole;
  country: string;
  status: EStatus;
  verificationToken: string
  verificationTokenExpiresAt: Date
  lastLogin: Date
  createdAt: Date;
  updatedAt: Date;
}

interface IKid extends Document {
  parentId: ObjectId; // Reference to the Parent (User)
  name: string;
  password: string;
  role: ERole;
  photo?: string; // Optional field
  status: EStatus;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema: Schema = new Schema<IUser>(
  {
    firstName: { type: String, required: [true, 'First name is a required field'], trim: true },
    lastName: { type: String, required: [true, 'Last name is a required field'], trim: true },
    fullName: { type: String, required: [true, 'Full name is a required field'], trim: true },
    email: { type: String, required: [true, 'Email is a required field'], unique: true, trim: true },
    password: { type: String, required: [true, 'Password is a required field'] },
    country: { type: String, required: [true, 'Country is a required field'] },
    photo: { type: String, default: null },
    phoneNumber: { type: String, required: [true, 'Phone number is a required field'], unique: true },
    isVerified: { type: Boolean, default: false },
    verificationToken: String,
    verificationTokenExpiresAt: Date,
    lastLogin: {type: Date, default: Date.now},
    role: { type: String, enum: Object.values(ERole)}, //Parent or Admin
    gender: { type: String, enum: Object.values(EGender), required: [true, 'Gender is a required field'] },
    status: { type: String, enum: Object.values(EStatus), required: true, default: EStatus.Active},
  },
  { timestamps: true } // Automatic management of `createdAt` and `updatedAt`
);

const kidSchema = new Schema<IKid>(
  {
    parentId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // Links the child to a parent
    name: { type: String, required: true, trim: true },
    password: { type: String, required: true },
    photo: { type: String, default: null },
    role: { type: String, enum: Object.values(ERole), default: ERole.Kid},
    status: { type: String, enum: Object.values(EStatus), required: true, default: EStatus.Active},
  },
  { timestamps: true }
);


userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    return next();
  }
  try {
    const salt = await bcrypt.genSalt(12); 
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error: any) {
    next(error); // Pass any error to the next middleware
  }
});


// Export the model
export const User = model<IUser>("User", userSchema);
export const Kid = model<IKid>("Kid", kidSchema);
