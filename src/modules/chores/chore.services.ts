import { Request, Response } from "express";
import { uploadSingleFile } from "../../utils/file_upload.utils";
import { Chore } from "./chore.model";
import status_codes from "../../utils/status_constants";
import AuthenticatedRequest from "../../models/AuthenticatedUser";
import { User } from "../users/user.model";
import { EChoreStatus } from "../../models/enums";

class ChoreService {
  static async createChore(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.body) {
        return res.status(status_codes.HTTP_422_UNPROCESSABLE_ENTITY).json({
          status: 422,
          success: false,
          message: "Unprocessable request body",
        });
      }

      if (!req.user) {
        return res.status(status_codes.HTTP_401_UNAUTHORIZED).json({
          status: 401,
          success: false,
          message: "Unauthorized access",
        });
      }

      const { title, description, earn, dueDate } = req.body;
      const parentId = req.user;
      const existingParent = await User.findById({ _id: parentId })
      if (!existingParent) {
          return res.status(status_codes.HTTP_404_NOT_FOUND).json({status: 404, success: false, message: `Parent with the id: ${parentId} not found`})
      }

      let choreImageUrl: string | null = null;

      if (req.file) {
        const result = await uploadSingleFile(req.file);
        choreImageUrl = result?.secure_url || null;
      }

      const newChore = await new Chore({
        parentId,
        title,
        description,
        earn,
        dueDate,
        photo: choreImageUrl,
      });

      await newChore.save();

      return res
        .status(status_codes.HTTP_200_OK)
        .json({
          status: 200,
          success: true,
          data: newChore,
          message: "Chore created successfully",
        });
    } catch (error: any) {
      console.error("Chore creation error:", error);
      return res.status(status_codes.HTTP_500_INTERNAL_SERVER_ERROR).json({
        status: 500,
        success: false,
        message: "Internal server error",
        error: error?.message,
      });
    }
  }

  static async fetchAllChores(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(status_codes.HTTP_401_UNAUTHORIZED).json({
          status: 401,
          success: false,
          message: "Unauthorized access",
        });
      }

      const parentId = req.user;

      const existingParent = await User.findById({ _id: parentId })

      if (!existingParent) {
          return res.status(status_codes.HTTP_404_NOT_FOUND).json({status: 404, success: false, message: `Parent with the id: ${parentId} not found`})
      }

      const chores = await Chore.find();

      return res
        .status(status_codes.HTTP_200_OK)
        .json({
          status: 200,
          success: true,
          message: "Chores retrieved successfully",
          data: chores
        });
      
    } catch (error: any) {
      console.error("Chore creation error:", error);
      return res.status(status_codes.HTTP_500_INTERNAL_SERVER_ERROR).json({
        status: 500,
        success: false,
        message: "Internal server error",
        error: error?.message,
      });
    }
  }

  static async fetchInprogressChores(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(status_codes.HTTP_401_UNAUTHORIZED).json({
          status: 401,
          success: false,
          message: "Unauthorized access",
        });
      }

      const parentId = req.user;

      const existingParent = await User.findById({ _id: parentId })
      
      if (!existingParent) {
          return res.status(status_codes.HTTP_404_NOT_FOUND).json({status: 404, success: false, message: `Parent with the id: ${parentId} not found`})
      }


      const inProgressChores = await Chore.find({status: EChoreStatus.InProgress})

      return res
        .status(status_codes.HTTP_200_OK)
        .json({
          status: 200,
          success: true,
          message: "In-Progress chores retrieved successfully",
          data: inProgressChores,
        });
      
    } catch (error: any) {
      console.error("Chore creation error:", error);
      return res.status(status_codes.HTTP_500_INTERNAL_SERVER_ERROR).json({
        status: 500,
        success: false,
        message: "Internal server error",
        error: error?.message,
      });
    }
  }

  static async fetchCompletedChores(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(status_codes.HTTP_401_UNAUTHORIZED).json({
          status: 401,
          success: false,
          message: "Unauthorized access",
        });
      }

      const parentId = req.user;
      const existingParent = await User.findById({ _id: parentId })
      if (!existingParent) {
          return res.status(status_codes.HTTP_404_NOT_FOUND).json({status: 404, success: false, message: `Parent with the id: ${parentId} not found`})
      }

      const completedChores = await Chore.find({status: EChoreStatus.Completed}).populate("kidId")

      return res
        .status(status_codes.HTTP_200_OK)
        .json({
          status: 200,
          success: true,
          message: "Completed chores retrieved successfully",
          data: completedChores,
        });
      
    } catch (error: any) {
      console.error("Chore creation error:", error);
      return res.status(status_codes.HTTP_500_INTERNAL_SERVER_ERROR).json({
        status: 500,
        success: false,
        message: "Internal server error",
        error: error?.message,
      });
    }
  }

  static async fetchUnclaimedChores(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(status_codes.HTTP_401_UNAUTHORIZED).json({
          status: 401,
          success: false,
          message: "Unauthorized access",
        });
      }

      const parentId = req.user;
      const existingParent = await User.findById({ _id: parentId })
      if (!existingParent) {
          return res.status(status_codes.HTTP_404_NOT_FOUND).json({status: 404, success: false, message: `Parent with the id: ${parentId} not found`})
      }

      const unclaimedChores = await Chore.find({status: EChoreStatus.Unclaimed})

      return res
        .status(status_codes.HTTP_200_OK)
        .json({
          status: 200,
          success: true,
          message: "Unclaimed chores retrieved successfully",
          data: unclaimedChores
        });
      
    } catch (error: any) {
      console.error("Chore creation error:", error);
      return res.status(status_codes.HTTP_500_INTERNAL_SERVER_ERROR).json({
        status: 500,
        success: false,
        message: "Internal server error",
        error: error?.message,
      });
    }
  }

  static async fetchChore(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(status_codes.HTTP_401_UNAUTHORIZED).json({
          status: 401,
          success: false,
          message: "Unauthorized access",
        });
      }
      const { id } = req.params
      
      if (!id) {
        return res.status(status_codes.HTTP_400_BAD_REQUEST).json({status: 400, success: false, message: "Provide a valid id"})
      }

      const parentId = req.user;
      const existingParent = await User.findById({ _id: parentId })

      if (!existingParent) {
          return res.status(status_codes.HTTP_404_NOT_FOUND).json({status: 404, success: false, message: `Parent with the id: ${parentId} not found`})
      }
 
      const existingChore = await Chore.findById(id)

      if (!existingChore) {
        return res.status(status_codes.HTTP_404_NOT_FOUND).json({status: 404, success: false, messgae: `Chore with this id: ${id} not found!`})
      }

      return res
        .status(status_codes.HTTP_200_OK)
        .json({
          status: 200,
          success: true,
          message: "Chore retrieved successfully",
          data: existingChore
        });
      
    } catch (error: any) {
      console.error("Chore fetching error:", error);
      return res.status(status_codes.HTTP_500_INTERNAL_SERVER_ERROR).json({
        status: 500,
        success: false,
        message: "Internal server error",
        error: error?.message,
      });
    }
  }

  static async approveChoreReward(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(status_codes.HTTP_401_UNAUTHORIZED).json({
          status: 401,
          success: false,
          message: "Unauthorized access",
        });
      }
      const { id } = req.params
      
      if (!id) {
        return res.status(status_codes.HTTP_400_BAD_REQUEST).json({status: 400, success: false, message: "Provide a valid id!"})
      }

      const parentId = req.user;
      const existingParent = await User.findById({ _id: parentId })

      if (!existingParent) {
          return res.status(status_codes.HTTP_404_NOT_FOUND).json({status: 404, success: false, message: `Parent with the id: ${parentId} not found`})
      }

   
      const existingChore = await Chore.findById({ _id: id })

      if (!existingChore) {
        return res.status(status_codes.HTTP_404_NOT_FOUND).json({status: 404, success: false, messgae: `Chore with this id: ${id} not found!`})
      }

      existingChore.isRewardApproved = true;
      existingChore.save()

      return res
        .status(status_codes.HTTP_200_OK)
        .json({
          status: 200,
          success: true,
          data: existingChore,
          message: "Reward approved successfully",
        });
      
    } catch (error: any) {
      console.error("Chore fetching error:", error);
      return res.status(status_codes.HTTP_500_INTERNAL_SERVER_ERROR).json({
        status: 500,
        success: false,
        message: "Internal server error",
        error: error?.message,
      });
    }
  }

}

export default ChoreService;
