import { Request, Response } from "express";
import { status_codes } from "../../utils/status_constants.js";
import SavingService from "./saving.service.js";
import { Kid } from "../users/user.model.js";
import asyncHandler from "express-async-handler";
import {
     BadRequestError,
  NotFoundError,
  UnauthorizedError,
  UnprocessableEntityError,
} from "../../models/errors.js";

class SavingController {
  static CreateSaving = asyncHandler(async (req: Request, res: Response) => {
     
     const kid = await Kid.findById(req.user);
       
    if (!kid) {
      throw new UnauthorizedError("Unauthorized access");
    }

    if (!req.body) {
      throw new UnprocessableEntityError("Unprocessable request body");
    }

    const saving = await SavingService.createSaving(req.body, kid._id);

    if (!saving) {
      throw new NotFoundError("Saving not found!");
    }

    res.status(status_codes.HTTP_201_CREATED).json({
      status: 201,
      success: true,
      message: "Saving created successfully.",
      data: saving,
    });
    return;
  });

  static FetchSaving = asyncHandler(async(req: Request, res: Response) => {
     const kid = await Kid.findById(req.user);
       
     if (!kid) {
          throw new UnauthorizedError("Unauthorized access");
     }

     const { id } = req.params;

     if (!id) {
       throw new BadRequestError("Please provide a valid id")
     }

     const saving = await SavingService.fetchSaving(id, kid._id);

     if (!saving) {
          throw new NotFoundError("Saving not found!");
     }

     res.status(status_codes.HTTP_200_OK).json({
       status: 200,
       success: true,
       message: "Saving fetched successfully.",
       data: saving,
     });
     return;
 })

  static FetchAllSavings = asyncHandler(async (req: Request, res: Response) => {
     const kid = await Kid.findById(req.user);
  
       if (!kid) {
          throw new UnauthorizedError("Unauthorized access");
     }

     const page = Number(req.query.page) || 1;
     const limit = Number(req.query.limit) || 10;

     const savings = await SavingService.fetchAllSavings(kid._id, page, limit);

     if (savings.result === 0) {
          throw new NotFoundError("No savings found!");
     }

     res.status(status_codes.HTTP_200_OK).json({
       status: 200,
       success: true,
       message: "Savings fetched successfully.",
       result: {
         data: savings.result,
         pagination: savings.pagination,
       },
     });
     return;
 })

  static DeleteSaving = asyncHandler( async (req: Request, res: Response) => {
     const kid = await Kid.findById(req.user);
     if (!kid) {
          throw new UnauthorizedError("Unauthorized access");
     }

     const { id } = req.params;

     if (!id) {
          throw new BadRequestError("Please provide a valid id")
     }

     const saving = await SavingService.deleteSaving(id, kid._id);

     if (!saving) {
          throw new NotFoundError("Saving not found!");
     }

     res.status(status_codes.HTTP_204_NO_CONTENT).json({
       status: 204,
       success: true,
       message: "Saving deleted successfully.",
     });
     return;
 })
}

export default SavingController;