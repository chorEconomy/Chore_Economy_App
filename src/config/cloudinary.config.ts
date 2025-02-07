const cloudinaryConfig = require("cloudinary").v2;
const dotenv = require("dotenv")
dotenv.config()

cloudinaryConfig.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUDINARY_KEY,
  api_secret: process.env.CLOUDINARY_SECRET,
});

export default cloudinaryConfig
