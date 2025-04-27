import RefreshToken from "../modules/users/refresh.token.model.js";
import jwt from "jsonwebtoken"
import * as dotenv from "dotenv";
dotenv.config()


async function storeRefreshToken(userId: string, refreshToken: string) {
    try {
        await RefreshToken.findOneAndUpdate(
            { userId }, // Find by user ID
            { refreshToken }, // Overwrite old token
            { upsert: true, new: true } // Ensure only one token per user
        );
    } catch (error) {
        console.error('Error storing refresh token', error);
        throw new Error('Error storing refresh token');
    }
}



async function generateTokens(user: any) { 
    const ACCESS_SECRET = process.env.ACCESS_SECRET;
    const REFRESH_SECRET = process.env.REFRESH_SECRET;

    if (!user || !ACCESS_SECRET || !REFRESH_SECRET) {
        throw new Error("Unable to generate tokens")
    }

    const access_token = jwt.sign({ sub: user._id }, ACCESS_SECRET, { expiresIn: "1m" });
    const refresh_token = jwt.sign({ sub: user._id}, REFRESH_SECRET, { expiresIn: "3d" });

    // Update the user's last login time
    await user.updateOne({ lastLogin: new Date() });

    await storeRefreshToken(user._id, refresh_token) 
    
    return { access_token, refresh_token };
}

async function generate_reset_token(user: any) {
    const ACCESS_SECRET = process.env.ACCESS_SECRET;
    
    if (!user || !ACCESS_SECRET) {
        throw new Error("Unable to generate token")
    }
    const access_token = jwt.sign({ sub: user._id }, ACCESS_SECRET, { expiresIn: "1m" });
    return access_token
}

function decode_token(token: string) {
    const secret = process.env.ACCESS_SECRET;
    if (!token || !secret) {
        throw new Error("Token or secret not provide")
    }
    try {
        const decoded = jwt.verify(token, secret) as { sub: string };
        const userId = decoded.sub;
        return userId
    } catch (error: any) {
         throw new Error("Failed to verify token")
    }
}

async function verifyRefreshTokenAndIssueNewAccessToken(refreshToken: string) {
    const REFRESH_SECRET: any = process.env.REFRESH_SECRET;
    const ACCESS_SECRET: any = process.env.ACCESS_SECRET;

    try {
        const decoded = jwt.verify(refreshToken, REFRESH_SECRET) as { sub: string };

        // Find the refresh token that matches the given token and userId
        const previousToken = await RefreshToken.findOne({ userId: decoded.sub, refreshToken });

        if (!previousToken) {
            throw new Error('Refresh token not found or already used');
        }

        // **Delete the used refresh token** to prevent reuse
        await RefreshToken.deleteOne({ userId: decoded.sub, refreshToken });

        // Generate new access and refresh tokens
        const newAccessToken = jwt.sign({ sub: decoded.sub }, ACCESS_SECRET, { expiresIn: '1m' });
        const newRefreshToken = jwt.sign({ sub: decoded.sub }, REFRESH_SECRET, { expiresIn: '3d' });

        // Store the new refresh token in MongoDB
        await storeRefreshToken(decoded.sub, newRefreshToken);

        return { newAccessToken, newRefreshToken };
    } catch (error) {
        throw new Error('Invalid or expired refresh token');
    }
}

export { decode_token, generateTokens, generate_reset_token, verifyRefreshTokenAndIssueNewAccessToken };