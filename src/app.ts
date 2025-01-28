const express = require("express");
import { NextFunction, Request, Response } from "express"; 
import registerRouter from "./modules/users/user.routes";
import HttpException from "./models/HttpException"

const cors = require("cors"); 
import status_codes  from "./utils/status_constants"; 
import normalizeError from "./utils/normalize_error";
import globalErrorHandler from "./middlewares/globalErrorHandler";

const app = express();

//==================MIDDLEWARES=================
app.use(express.json())
app.use(express.urlencoded({ extended: true}));




//====== routes for application========//
app.get("/api/v1/home", (req: Request, res: Response) => {
    res.status(status_codes.HTTP_200_OK).json({
      message: "Welcome to Chore Economy!!",
      status: 200,
    });
});

app.use("/api/v1/auth", registerRouter)

// Controlling when a user try to hit on any undefined route or path....
app.use("*", (req: Request, res: Response, next: NextFunction) => {
  const error = new HttpException(status_codes.HTTP_404_NOT_FOUND, `Can't find ${req.originalUrl} on the server!`)
  next(error)
});

app.use(globalErrorHandler);

export default app