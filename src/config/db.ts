import mongoose from "mongoose";
import * as dotenv from "dotenv";
dotenv.config()

const connectToDB = async () => {
    try {
        await mongoose.connect(process.env.MONG0_STRING as string);
        return console.log('database connected successfully ✔✔✔');
    } catch (error: any) {
        console.error(error.message);
    }
}

export default connectToDB