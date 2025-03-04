import mongoose from "mongoose";
import * as dotenv from "dotenv";
dotenv.config();
const connectToDB = async () => {
    try {
        await mongoose.connect(process.env.MONG0_STRING);
        return console.log('database connected successfully ✔✔✔');
    }
    catch (error) {
        console.error(error.message);
    }
};
export default connectToDB;
