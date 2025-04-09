
import asyncHandler from "express-async-handler";
import { Request, Response } from "express";
import { status_codes } from "../../utils/status_constants.js";
import {
    NotFoundError,
    UnauthorizedError,
} from "../../models/errors.js";
import { Kid } from "../users/user.model.js";
import WalletService from "./wallet.service.js";

class WalletController {

    static fetchWallet = asyncHandler(async (req: Request, res: Response) => { 

        const
            kid = await Kid.findById(req.user);
        
        if (!kid) {
            throw new UnauthorizedError("Unauthorized access");
        }

        const wallet = await WalletService.fetchWallet(kid);

        if (!wallet) {
            throw new NotFoundError("Wallet not found!");
        }

        res.status(status_codes.HTTP_200_OK).json({
            status: 200,
            success: true,
            data: wallet
        })
        return;
    })
}

export default WalletController;