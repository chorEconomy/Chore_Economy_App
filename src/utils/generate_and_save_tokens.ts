import { User } from "../modules/users/user.model";
import { encode_token } from "./token_management";

async function generateAndSaveTokens(user: any) {
    // Generate access and refresh tokens
    const access_token = encode_token(user._id, '30m');
    const refresh_token = encode_token(user._id, '2d');

    // Get the existing tokens, if any
    let oldTokens = user.tokens || [];

    // Clean up expired tokens
    oldTokens = oldTokens.filter((token: any) => {
        const timeDifference = (Date.now() - parseInt(token.signedAt)) / 1000;
        if (token.access_token && timeDifference < 1800) {
            return true; // Keep access tokens within 30 minutes
        }
        if (token.refresh_token && timeDifference < 172800) {
            return true; // Keep refresh tokens within 3 days
        }
        return false; // Remove expired tokens
    });

    // Store both access and refresh tokens together
    await User.findByIdAndUpdate(user._id, {
        tokens: [
            ...oldTokens,
            {
                access_token,
                refresh_token,
                signedAt: Date.now().toString(),
            },
        ],
    });

    // Update the user's last login time
    user.lastLogin = new Date();
    await user.save();

    return { access_token, refresh_token };
}

export default generateAndSaveTokens