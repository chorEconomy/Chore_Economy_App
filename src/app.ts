const express = require("express");
import { Request, Response } from "express"; 

const cors = require("cors"); 
import status_codes  from "./utils/status_constants";

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

// Controlling when a user try to hit on any undefined route or path....
app.use("*", (req: Request, res: Response) => {
    res.status(status_codes.HTTP_404_NOT_FOUND).json({ status: 404, message: "Sorry, Api Does Not Exist!!!" });
});


export default app