import mongoose, { Schema } from 'mongoose';
// Define the schema
const refreshTokenSchema = new Schema({
    userId: { type: String, required: true },
    refreshToken: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
}, { timestamps: true } // Automatically add createdAt and updatedAt fields
);
// Create the model
const RefreshToken = mongoose.model('RefreshToken', refreshTokenSchema);
export default RefreshToken;
