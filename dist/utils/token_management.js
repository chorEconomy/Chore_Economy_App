import RefreshToken from "../modules/users/refresh.token.model.js";
import jwt from "jsonwebtoken";
import * as dotenv from "dotenv";
dotenv.config();
async function storeRefreshToken(userId, refreshToken) {
    try {
        // Overwrite any existing refresh token for this user
        await RefreshToken.findOneAndUpdate({ userId }, { refreshToken }, { upsert: true, new: true });
    }
    catch (error) {
        console.error("❌ Error storing refresh token:", error);
        throw new Error("Could not store refresh token");
    }
}
async function generateTokens(user) {
    const ACCESS_SECRET = process.env.ACCESS_SECRET;
    const REFRESH_SECRET = process.env.REFRESH_SECRET;
    if (!user || !ACCESS_SECRET || !REFRESH_SECRET) {
        throw new Error("Unable to generate tokens");
    }
    const access_token = jwt.sign({ sub: user._id }, ACCESS_SECRET, { expiresIn: "15m" });
    const refresh_token = jwt.sign({ sub: user._id }, REFRESH_SECRET, { expiresIn: "3d" });
    // Update the user's last login time
    await user.updateOne({ lastLogin: new Date() });
    await storeRefreshToken(user._id, refresh_token);
    return { access_token, refresh_token };
}
async function generate_reset_token(user) {
    const ACCESS_SECRET = process.env.ACCESS_SECRET;
    if (!user || !ACCESS_SECRET) {
        throw new Error("Unable to generate token");
    }
    const access_token = jwt.sign({ sub: user._id }, ACCESS_SECRET, { expiresIn: "15m" });
    return access_token;
}
function decode_token(token) {
    const secret = process.env.ACCESS_SECRET;
    if (!token || !secret) {
        throw new Error("Token or secret not provide");
    }
    try {
        const decoded = jwt.verify(token, secret);
        const userId = decoded.sub;
        return userId;
    }
    catch (error) {
        throw new Error("Failed to verify token");
    }
}
// async function verifyRefreshTokenAndIssueNewAccessToken(refreshToken: string) {
//   const REFRESH_SECRET: any = process.env.REFRESH_SECRET;
//   const ACCESS_SECRET: any = process.env.ACCESS_SECRET;
//     let decoded: any;
//     try {
//       decoded = jwt.verify(refreshToken, REFRESH_SECRET);
//       console.log('Decoded Refresh Token:', decoded);
//     // Check if token exists in DB (and hasn’t been used yet)
//     const previousToken = await RefreshToken.findOne({ userId: decoded.sub, refreshToken });
//     if (!previousToken) {
//       throw new Error('Refresh token not found or already used');
//     }
//     // Delete old refresh token (single-use)
//     await RefreshToken.deleteOne({ userId: decoded.sub, refreshToken });
//     // Generate new tokens
//     const newAccessToken = jwt.sign({ sub: decoded.sub }, ACCESS_SECRET, { expiresIn: '15m' });
//     const newRefreshToken = jwt.sign({ sub: decoded.sub }, REFRESH_SECRET, { expiresIn: '3d' });
//     // Store new refresh token in DB
//     await storeRefreshToken(decoded.sub, newRefreshToken);
//     return {
//       newAccessToken,
//       newRefreshToken,
//     };
//   } catch (error: any) {
//     console.error('Token refresh error:', error.message);
//     throw new Error('Invalid or expired refresh token');
//   }
// }
async function verifyRefreshTokenAndIssueNewAccessToken(refreshToken) {
    const REFRESH_SECRET = process.env.REFRESH_SECRET;
    const ACCESS_SECRET = process.env.ACCESS_SECRET;
    try {
        // ✅ Decode the refresh token
        const decoded = jwt.verify(refreshToken, REFRESH_SECRET);
        console.log("✅ Decoded Refresh Token:", decoded);
        const userId = decoded.sub;
        // 🔍 Check if token exists in DB (single-use enforcement)
        const existingToken = await RefreshToken.findOne({ userId, refreshToken });
        if (!existingToken) {
            console.warn("⚠️ Refresh token not found in DB or already used");
            throw new Error("Refresh token not found or already used");
        }
        // 🧹 Delete the old refresh token to prevent reuse
        await RefreshToken.deleteOne({ userId, refreshToken });
        // 🔐 Generate new tokens
        const newAccessToken = jwt.sign({ sub: userId }, ACCESS_SECRET, { expiresIn: "15m" });
        const newRefreshToken = jwt.sign({ sub: userId }, REFRESH_SECRET, { expiresIn: "3d" });
        // 💾 Store new refresh token
        await storeRefreshToken(userId, newRefreshToken);
        return {
            newAccessToken,
            newRefreshToken,
        };
    }
    catch (error) {
        console.error("❌ Token refresh error:", error.message);
        throw new Error("Token invalid or expired. Please login again.");
    }
}
export { decode_token, generateTokens, generate_reset_token, verifyRefreshTokenAndIssueNewAccessToken };
