import dotenv from "dotenv";
dotenv.config();
import app from "./app.js";
//Database connection
import connectToDB from "./config/db.js";
//Initializing PORT
const port = process.env.PORT || 3030;
//Server listening function...
app.listen(port, async () => {
    await connectToDB();
    console.log(`listening on port ${port} on the local server...`);
});
