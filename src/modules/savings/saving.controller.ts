import { Request, Response } from "express";
import {status_codes} from "../../utils/status_constants.js";
import { SavingsPlans } from "aws-sdk";
import SavingService from "./saving.service.js";
import { Kid } from "../users/user.model.js";
import { Saving } from "./saving.model.js";

class SavingController {
    static async CreateSaving(req: Request, res: Response) {
        try {
            const kid = await Kid.findById(req.user)
            if (!kid) {
                 res.status(status_codes.HTTP_401_UNAUTHORIZED).json({
                  status: 401,
                  success: false,
                  message: "Unauthorized access",
                 });
                return
            }

            if (!req.body) {
                 res.status(status_codes.HTTP_422_UNPROCESSABLE_ENTITY).json({
                    status: 422,
                    success: false,
                    message: "Unprocessible entity",
                 });
                 return
            }
            
            const saving = await SavingService.createSaving(req.body, kid._id)

            if (!saving) {
                 res.status(status_codes.HTTP_404_NOT_FOUND).json({
                    status: 404,
                    success: false,
                    message: "Error occurred while creating the saving. Saving not found."
                 }); 
                 return
            }

             res.status(status_codes.HTTP_201_CREATED).json({
                status: 201,
                success: true,
                message: "Saving created successfully.",
                data: saving
            })
            return
        } catch (error: any) {
             res.status(status_codes.HTTP_500_INTERNAL_SERVER_ERROR).json({
                status: 500,
                success: false,
                message: "Internal server error",
                error: error?.message || 'An unexpected error occurred.',
             });
             return
        }
    }

    static async FetchSaving(req: Request, res: Response) {
        try {
            const kid = await Kid.findById(req.user)
            if (!kid) {
                 res.status(status_codes.HTTP_401_UNAUTHORIZED).json({
                  status: 401,
                  success: false,
                  message: "Unauthorized access",
                 });
                return
            }

            const { id } = req.params
            
            if (!id) {
                 res.status(status_codes.HTTP_400_BAD_REQUEST).json({
                    status: 400,
                    success: false,
                    message: "Please provide a valid Id!",
                 });
                 return
            }

            const saving = await SavingService.fetchSaving(id, kid._id)
            
            if (!saving) {
                 res.status(status_codes.HTTP_404_NOT_FOUND).json({
                    status: 404,
                    success: false,
                    message: "Saving not found."
                 }); 
                 return
            }

             res.status(status_codes.HTTP_200_OK).json({
                status: 200,
                success: true,
                message: "Saving fetched successfully.",
                data: saving
             })
             return

        } catch (error: any) {
             res.status(status_codes.HTTP_500_INTERNAL_SERVER_ERROR).json({
                status: 500,
                success: false,
                message: "Internal server error",
                error: error?.message || 'An unexpected error occurred.',
             });
             return
        }
    }
    
    static async FetchAllSavings(req: Request, res: Response) {
        try {
            const kid = await Kid.findById(req.user)
            if (!kid) {
                 res.status(status_codes.HTTP_401_UNAUTHORIZED).json({
                  status: 401,
                  success: false,
                  message: "Unauthorized access",
                 });
                return
            }

            const page = Number(req.query.page) || 1;
            const limit = Number(req.query.limit) || 10;


            const savings = await SavingService.fetchAllSavings(kid._id, page, limit)

            if (savings.data === 0) {
                 res.status(status_codes.HTTP_404_NOT_FOUND).json({
                    status: 404,
                    success: false,
                    message: "No savings found."
                 }); 
                 return
            }

             res.status(status_codes.HTTP_200_OK).json({
                status: 200,
                success: true,
                message: "Savings fetched successfully.",
                result: {
                    data: savings.data,
                    pagination: savings.pagination
                }
            })

        } catch (error: any) {
             res.status(status_codes.HTTP_500_INTERNAL_SERVER_ERROR).json({
                status: 500,
                success: false,
                message: "Internal server error",
                error: error?.message || 'An unexpected error occurred.',
              });
        }
    }
   
    static async DeleteSaving(req: Request, res: Response) {
        try {
            const kid = await Kid.findById(req.user)
            if (!kid) {
                 res.status(status_codes.HTTP_401_UNAUTHORIZED).json({
                  status: 401,
                  success: false,
                  message: "Unauthorized access",
                 });
                 return
            }

            const { id } = req.params
            
            if (!id) {
                 res.status(status_codes.HTTP_400_BAD_REQUEST).json({
                    status: 400,
                    success: false,
                    message: "Please provide a valid Saving ID!"
                 });
                 return
            }


            const saving = await SavingService.deleteSaving(id, kid._id)

            if (!saving) {
                 res.status(status_codes.HTTP_404_NOT_FOUND).json({
                    status: 404,
                    success: false,
                    message: "Saving not found or already deleted."
                 }); 
                 return
            }

             res.status(status_codes.HTTP_204_NO_CONTENT).json({
                status: 204,
                success: true,
                message: "Saving deleted successfully.",
             })
             return

        } catch (error: any) {
             res.status(status_codes.HTTP_500_INTERNAL_SERVER_ERROR).json({
                status: 500,
                success: false,
                message: "Internal server error",
                error: error?.message || 'An unexpected error occurred.',
             });
             return
        }
    }
}

export default SavingController