import { Request } from "express"; 

// Extend Express Request to include 'file'
export default interface CustomRequest extends Request {
  file?: Express.Multer.File; // More type-safe than 'any'
}