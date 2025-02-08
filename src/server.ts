const dotenv = require("dotenv")

import app from './app';

dotenv.config()

//Database connection
const connectDB = require("./config/db")

//Initializing PORT
const port = process.env.PORT || 3030; 

//Server listening function...
app.listen(port, async () => {
    await connectDB();
    console.log(`listening on port ${port} on the local server...`);
  });
  