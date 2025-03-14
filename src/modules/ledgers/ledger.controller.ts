import asyncHandler from "express-async-handler";
import { Request, Response } from "express";
import { status_codes } from "../../utils/status_constants.js";
import {
    BadRequestError,
    NotFoundError,
    UnauthorizedError,
} from "../../models/errors.js";
import { Kid } from "../users/user.model.js";
import LedgerTransactionService from "./ledger.service.js";

class LedgerController {
    static getLedger = asyncHandler(async (req: Request, res: Response) => {
        const kid = await Kid.findById(req.user);
        if (!kid) {
            throw new UnauthorizedError("Unauthorized access");
        }

        const { transactionId } = req.params;
        if (!transactionId) {
            throw new BadRequestError("Please provide a valid transaction id");
        }

        const ledger = await LedgerTransactionService.FetchOneLedgerTransaction(kid, transactionId);
        if (!ledger) {
            throw new NotFoundError("Ledger not found!");
        }

        res.status(status_codes.HTTP_200_OK).json({
            status: 200,
            success: true,
            message: "Ledger fetched successfully.",
            data: ledger
        })
        return;
    })

    static getLedgers = asyncHandler(async (req: Request, res: Response) => {
        
        const kid = await Kid.findById(req.user);

        if (!kid) {
            throw new UnauthorizedError("Unauthorized access");
        }

        const { page, limit } = req.query;

        const ledgers = await LedgerTransactionService.FetchLedgerTransactions(kid, Number(page), Number(limit));

        if (!ledgers) {
            throw new NotFoundError("Ledgers not found!");
        }

        res.status(status_codes.HTTP_200_OK).json({
            status: 200,
            success: true,
            message: "Ledgers fetched successfully.",
            data: ledgers
        })
        return;
    })  
}

export default LedgerController;