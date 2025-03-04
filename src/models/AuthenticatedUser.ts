import { Request } from "express";

export interface AuthenticatedRequest extends Request {
  user: any;  // or use a more specific type for user if available
}
