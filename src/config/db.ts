const mongoose = require("mongoose")

const connectToDB = async () => {
    try {
        await mongoose.connect(process.env.MONG0_STRING);
        return console.log('database connected successfully ✔✔✔');
    } catch (error: any) {
        console.error(error.message);
    }
}

module.exports = connectToDB;