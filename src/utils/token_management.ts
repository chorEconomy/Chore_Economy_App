const jwt = require('jsonwebtoken');

function encode_token(userId: string, expiresIn = '5m') {
    const secret = process.env.JWT_SECRET; 
    if (!userId || !secret) {
        return false;
    }
    const token = jwt.sign({ userId }, secret, { expiresIn });
    return token;
}



function decode_token(token: string){
    const secret    = process.env.JWT_SECRET
    if(!token || !secret) return {
        status: false,
        message: "Token or not provided",
        userId : null
    }
    try {
        const {userId} = jwt.verify(token, secret)
        return userId
    } catch (error: any) {
        throw new Error(error.message || "Failed to verify token")
    }
}


export {encode_token, decode_token}