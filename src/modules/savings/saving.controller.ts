import { Request, Response } from "express";
import AuthenticatedRequest from "../../models/AuthenticatedUser";
import status_codes from "../../utils/status_constants";
import { SavingsPlans } from "aws-sdk";
import SavingService from "./saving.service";
import { Kid } from "../users/user.model";
import { Saving } from "./saving.model";

class SavingController {
    static async CreateSaving(req: AuthenticatedRequest, res: Response) {
        try {
            const kid = await Kid.findById(req.user)
            if (!kid) {
                return res.status(status_codes.HTTP_401_UNAUTHORIZED).json({
                  status: 401,
                  success: false,
                  message: "Unauthorized access",
                });
            }

            if (!req.body) {
                return res.status(status_codes.HTTP_422_UNPROCESSABLE_ENTITY).json({
                    status: 422,
                    success: false,
                    message: "Unprocessible entity",
                  });
            }
            
            const saving = await SavingService.createSaving(req.body, kid._id)

            if (!saving) {
                return res.status(status_codes.HTTP_404_NOT_FOUND).json({
                    status: 404,
                    success: false,
                    message: "Error occurred while creating the saving. Saving not found."
                  }); 
            }

            return res.status(status_codes.HTTP_201_CREATED).json({
                status: 201,
                success: true,
                message: "Saving created successfully.",
                data: saving
            })

        } catch (error: any) {
            return res.status(status_codes.HTTP_500_INTERNAL_SERVER_ERROR).json({
                status: 500,
                success: false,
                message: "Internal server error",
                error: error?.message || 'An unexpected error occurred.',
              });
        }
    }

    static async FetchSaving(req: AuthenticatedRequest, res: Response) {
        try {
            const kid = await Kid.findById(req.user)
            if (!kid) {
                return res.status(status_codes.HTTP_401_UNAUTHORIZED).json({
                  status: 401,
                  success: false,
                  message: "Unauthorized access",
                });
            }

            const { id } = req.params
            
            if (!id) {
                return res.status(status_codes.HTTP_400_BAD_REQUEST).json({
                    status: 400,
                    success: false,
                    message: "Please provide a valid Id!",
                  });
            }

            const saving = await SavingService.fetchSaving(id, kid._id)
            
            if (!saving) {
                return res.status(status_codes.HTTP_404_NOT_FOUND).json({
                    status: 404,
                    success: false,
                    message: "Saving not found."
                  }); 
            }

            return res.status(status_codes.HTTP_200_OK).json({
                status: 200,
                success: true,
                message: "Saving fetched successfully.",
                data: saving
            })

        } catch (error: any) {
            return res.status(status_codes.HTTP_500_INTERNAL_SERVER_ERROR).json({
                status: 500,
                success: false,
                message: "Internal server error",
                error: error?.message || 'An unexpected error occurred.',
              });
        }
    }
    
    static async FetchAllSavings(req: AuthenticatedRequest, res: Response) {
        try {
            const kid = await Kid.findById(req.user)
            if (!kid) {
                return res.status(status_codes.HTTP_401_UNAUTHORIZED).json({
                  status: 401,
                  success: false,
                  message: "Unauthorized access",
                });
            }

            const page = Number(req.query.page) || 1;
            const limit = Number(req.query.limit) || 10;


            const savings = await SavingService.fetchAllSavings(kid._id, page, limit)

            if (savings.data === 0) {
                return res.status(status_codes.HTTP_404_NOT_FOUND).json({
                    status: 404,
                    success: false,
                    message: "No savings found."
                  }); 
            }

            return res.status(status_codes.HTTP_200_OK).json({
                status: 200,
                success: true,
                message: "Savings fetched successfully.",
                result: {
                    data: savings.data,
                    pagination: savings.pagination
                }
            })

        } catch (error: any) {
            return res.status(status_codes.HTTP_500_INTERNAL_SERVER_ERROR).json({
                status: 500,
                success: false,
                message: "Internal server error",
                error: error?.message || 'An unexpected error occurred.',
              });
        }
    }
   
    static async DeleteSaving(req: AuthenticatedRequest, res: Response) {
        try {
            const kid = await Kid.findById(req.user)
            if (!kid) {
                return res.status(status_codes.HTTP_401_UNAUTHORIZED).json({
                  status: 401,
                  success: false,
                  message: "Unauthorized access",
                });
            }

            const { id } = req.params
            
            if (!id) {
                return res.status(status_codes.HTTP_400_BAD_REQUEST).json({
                    status: 400,
                    success: false,
                    message: "Please provide a valid Saving ID!"
                  });
            }


            const saving = await SavingService.deleteSaving(id, kid._id)

            if (!saving) {
                return res.status(status_codes.HTTP_404_NOT_FOUND).json({
                    status: 404,
                    success: false,
                    message: "Saving not found or already deleted."
                  }); 
            }

            return res.status(status_codes.HTTP_204_NO_CONTENT).json({
                status: 204,
                success: true,
                message: "Saving deleted successfully.",
            })

        } catch (error: any) {
            return res.status(status_codes.HTTP_500_INTERNAL_SERVER_ERROR).json({
                status: 500,
                success: false,
                message: "Internal server error",
                error: error?.message || 'An unexpected error occurred.',
              });
        }
    }
}

export default SavingController