import mongoose, { Document, Schema } from 'mongoose';

// Define the schema for storing refresh tokens
interface IRefreshToken extends Document {
    userId: string;
    refreshToken: string;
    createdAt: Date;
    updatedAt: Date;
}

// Define the schema
const refreshTokenSchema = new Schema<IRefreshToken>(
    {
        userId: { type: String, required: true },
        refreshToken: { type: String, required: true },
        createdAt: { type: Date, default: Date.now },
        updatedAt: { type: Date, default: Date.now }
    },
    { timestamps: true } // Automatically add createdAt and updatedAt fields
);

// Create the model
const RefreshToken = mongoose.model<IRefreshToken>('RefreshToken', refreshTokenSchema);

export default RefreshToken;
