const jwt = require('jsonwebtoken'); 
import { Response } from "express";

export const generateTokenAndSetCookie =  (res: Response, user_id: string)  => {
    const token = jwt.sign({ user_id }, process.env.JWT_SECRET, {
        expiresIn: "7d"
    })

    res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000
    });

    return token
}