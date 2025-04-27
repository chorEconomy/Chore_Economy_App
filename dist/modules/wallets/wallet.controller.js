import asyncHandler from "express-async-handler";
import { status_codes } from "../../utils/status_constants.js";
import { NotFoundError, UnauthorizedError } from "../../models/errors.js";
import { Kid, Parent } from "../users/user.model.js";
import WalletService from "./wallet.service.js";
class WalletController {
    static fetchWallet = asyncHandler(async (req, res) => {
        let user = (await Parent.findById(req.user)) || (await Kid.findById(req.user));
        if (!user) {
            throw new UnauthorizedError("Unauthorized access");
        }
        const { kidId } = req.params;
        if (!kidId) {
            throw new NotFoundError("Kid ID is required!");
        }
        const wallet = await WalletService.fetchWallet(kidId);
        if (!wallet) {
            throw new NotFoundError("Wallet not found!");
        }
        res.status(status_codes.HTTP_200_OK).json({
            status: 200,
            success: true,
            data: wallet,
        });
        return;
    });
}
export default WalletController;
