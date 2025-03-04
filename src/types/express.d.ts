// express.d.ts (usually inside the 'src/types' folder)
import * as express from 'express';

declare global {
  namespace Express {
    interface Request {
      user?: any;  // Use a more specific type for 'user' if possible
    }
  }
}
