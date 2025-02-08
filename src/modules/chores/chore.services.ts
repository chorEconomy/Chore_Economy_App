import { Request, Response } from "express";
import { uploadSingleFile } from "../../utils/file_upload.utils";
import { Chore } from "./chore.model";
import status_codes from "../../utils/status_constants";
import AuthenticatedRequest from "../../models/AuthenticatedUser";

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
}

export default ChoreService;
