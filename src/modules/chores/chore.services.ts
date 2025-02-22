import { Request, Response } from "express";
import { uploadMultipleFiles, uploadSingleFile } from "../../utils/file_upload.utils";
import { Chore } from "./chore.model";
import status_codes from "../../utils/status_constants";
import AuthenticatedRequest from "../../models/AuthenticatedUser";
import { Kid, User } from "../users/user.model";
import { EChoreStatus, EStatus } from "../../models/enums";
import sendNotification from "../../utils/notifications";

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

      await sendNotification(existingParent.fcmToken, "Task Created", "You've successfully created a new task")

      return res
        .status(status_codes.HTTP_200_OK)
        .json({
          status: 200,
          success: true,
          data: newChore,
          message: "Chore created successfully and notification sent!",
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
      existingChore.status = EChoreStatus.Completed
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

  static async takeChore(req: AuthenticatedRequest, res: Response) {
      try {
        const kidId = req.user
        if (!kidId) {
            return res.status(status_codes.HTTP_401_UNAUTHORIZED).json({
                status: 401,
                success: false,
                message: "Unauthorized access",
            });
        }

        const choreId = req.params.id
        const existingChore = await Chore.findById(choreId)
        
      if (!existingChore) {
        return res.status(status_codes.HTTP_404_NOT_FOUND).json({status: 404, success: false, messgae: `Chore with this id: ${choreId} not found!`})
        }
        
        existingChore.status = EChoreStatus.InProgress
        existingChore.kidId = kidId

        await existingChore.save()

        return res
        .status(status_codes.HTTP_200_OK)
        .json({
          status: 200,
          success: true,
          data: existingChore,
          message: "Chore taken successfully",
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

  static async fetchAllChoresForKid(req: AuthenticatedRequest, res: Response) { 
    try {
      
      const kidId = req.user
      if (!kidId) {
          return res.status(status_codes.HTTP_401_UNAUTHORIZED).json({
              status: 401,
              success: false,
              message: "Unauthorized access",
          });
      }
      const chores = await Chore.find({ kidId: kidId })
      
      return res
      .status(status_codes.HTTP_200_OK)
      .json({
        status: 200,
        success: true,
        data: chores,
        message: "Kid's chores retrieved successfully",
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

  static async completeChore(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(status_codes.HTTP_401_UNAUTHORIZED).json({
          status: 401,
          success: false,
          message: "Unauthorized access",
        });
      }

      const choreId = req.params.id;
  
      // Find the existing chore
      const existingChore = await Chore.findById(choreId);

      if (!existingChore) {
        return res.status(status_codes.HTTP_404_NOT_FOUND).json({
          status: 404,
          success: false,
          message: `Chore with this ID: ${choreId} not found!`,
        });
      }

      if (existingChore.kidId.toString() !== req.user) {
        return res.status(status_codes.HTTP_403_FORBIDDEN).json({
          status: 403,
          success: false,
          message: "You are not allowed to complete this chore",
      });
      }
  
      // Upload images if available
      let choreImages: string[] = [];
      if (req.files) {
        const result = await uploadMultipleFiles(req.files);
        choreImages = result.map(res => res.secure_url);
      }
  
      // Update chore details
      existingChore.completedPhotos = choreImages;
      existingChore.status = EChoreStatus.Pending;
      await existingChore.save();

      return res.status(status_codes.HTTP_200_OK).json({
        status: 200,
        success: true,
        message: "Chore completed successfully",
        data: existingChore, // Optionally return updated chore
      });
  
    } catch (error: any) {
      console.error("Chore completing error:", error);
      return res.status(status_codes.HTTP_500_INTERNAL_SERVER_ERROR).json({
        status: 500,
        success: false,
        message: "Internal server error",
        error: error?.message,
      });
    }
  }
  

  static async denyChore(req: AuthenticatedRequest, res: Response) {
    try {
      const parentId = req.user
      if (!parentId) {
          return res.status(status_codes.HTTP_401_UNAUTHORIZED).json({
              status: 401,
              success: false,
              message: "Unauthorized access",
          });
      }
      const {id} = req.params
      const { reason } = req.body
      const chore = await Chore.findById(id)

      if (!chore) {
        return res.status(status_codes.HTTP_404_NOT_FOUND).json({
            status: 404,
            success: false,
            message: "Chore not found",
        });
      }

      if (chore.parentId.toString() !== parentId) {
        return res.status(status_codes.HTTP_403_FORBIDDEN).json({
          status: 403,
          success: false,
          message: "You are not allowed to deny this chore",
      });
      }

      chore.denialReason = reason || "No reason provided"
      chore.status = EChoreStatus.Rejected
      await chore.save()

      return res.status(status_codes.HTTP_200_OK).json({
        status: 200,
        success: true,
        message: "Chore has been denied",
        data: {
            choreId: chore._id,
            status: chore.status,
            denialReason: chore.denialReason,
        },
    });
    } catch (error: any) {
        console.error("Error denying chore:", error);
        return res.status(status_codes.HTTP_500_INTERNAL_SERVER_ERROR).json({
            status: 500,
            success: false,
            message: "Internal Server Error",
            error: error?.message,
        });
    }
  }

  static async fetchRejectedChores(req: AuthenticatedRequest, res: Response) {
    try {
        // Ensure authenticated user exists
        if (!req.user) {
            return res.status(status_codes.HTTP_401_UNAUTHORIZED).json({
                status: 401,
                success: false,
                message: "Unauthorized access",
            });
        }

        const kidId = req.user;

        // Check if kid exists
        const kid = await Kid.findById(kidId);
        if (!kid) {
            return res.status(status_codes.HTTP_404_NOT_FOUND).json({
                status: 404,
                success: false,
                message: "Kid not found",
            });
        }

        // Fetch rejected chores
        const rejectedChores = await Chore.find({
            kidId: kidId,
            status: EChoreStatus.Rejected,
        });

        return res.status(status_codes.HTTP_200_OK).json({
            status: 200,
            success: true,
            message: "Rejected chores retrieved successfully",
            data: rejectedChores,
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
