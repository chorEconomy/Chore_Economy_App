import mongoose, { Schema, model } from "mongoose";
import { EStatus, EGender, ERole } from "../../models/enums.js";
import bcrypt from "bcrypt";
const parentSchema = new Schema({
    firstName: {
        type: String,
        required: [true, "First name is a required field"],
        trim: true,
    },
    lastName: {
        type: String,
        required: [true, "Last name is a required field"],
        trim: true,
    },
    fullName: {
        type: String,
        required: [true, "Full name is a required field"],
        trim: true,
    },
    email: {
        type: String,
        required: [true, "Email is a required field"],
        unique: true,
        trim: true,
    },
    password: {
        type: String,
        required: [true, "Password is a required field"],
    },
    country: { type: String, required: [true, "Country is a required field"] },
    photo: { type: String, default: null },
    phoneNumber: {
        type: String,
        required: [true, "Phone number is a required field"],
        unique: true,
    },
    isVerified: { type: Boolean, default: false },
    fcmToken: { type: String, default: null },
    biometricKey: { type: String, default: null },
    canCreate: { type: Boolean, default: true },
    verificationToken: String,
    verificationTokenExpiresAt: Date,
    lastOtpRequest: Date,
    lastLogin: { type: Date, default: Date.now },
    role: { type: String, enum: Object.values(ERole), default: ERole.Parent },
    gender: {
        type: String,
        enum: Object.values(EGender),
        required: [true, "Gender is a required field"],
    },
    status: {
        type: String,
        enum: Object.values(EStatus),
        required: true,
        default: EStatus.Active,
    },
}, { timestamps: true });
parentSchema.index({ role: 1 });
const kidSchema = new Schema({
    parentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Parent",
        required: true,
    },
    name: { type: String, required: true, trim: true },
    password: { type: String, required: true },
    photo: { type: String, default: null },
    biometricKey: { type: String, default: null },
    role: { type: String, enum: Object.values(ERole), default: ERole.Kid },
    fcmToken: { type: String, default: null },
    gender: {
        type: String,
        enum: Object.values(EGender),
        required: [true, "Gender is a required field"],
    },
    status: {
        type: String,
        enum: Object.values(EStatus),
        required: true,
        default: EStatus.Active,
    },
}, { timestamps: true });
kidSchema.index({ name: 1 });
parentSchema.pre("save", async function (next) {
    if (!this.isModified("password")) {
        return next();
    }
    try {
        const salt = await bcrypt.genSalt(12);
        this.password = await bcrypt.hash(String(this.password), salt);
        next();
    }
    catch (error) {
        next(error); // Pass any error to the next middleware
    }
});
parentSchema.pre("save", function (next) {
    this.fullName = `${this.firstName} ${this.lastName}`.trim();
    next();
});
const adminSchema = new Schema({
    fullName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    verificationToken: String,
    verificationTokenExpiresAt: Date,
    lastOtpRequest: Date,
    role: { type: String, enum: Object.values(ERole), default: ERole.Admin },
}, { timestamps: true });
adminSchema.pre("save", async function (next) {
    if (!this.isModified("password")) {
        return next();
    }
    try {
        const salt = await bcrypt.genSalt(12);
        this.password = await bcrypt.hash(String(this.password), salt);
        next();
    }
    catch (error) {
        next(error); // Pass any error to the next middleware
    }
});
// Export the model
export const Parent = model("Parent", parentSchema);
export const Admin = model("Admin", adminSchema);
export const Kid = model("Kid", kidSchema);
