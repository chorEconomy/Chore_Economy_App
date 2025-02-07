import cloudinaryConfig from "../config/cloudinary.config";

/**
 * Upload a single file to Cloudinary
 * @param {Object} file - Multer file object (req.file)
 * @returns {Promise<Object>} - Cloudinary response
 */

const uploadSingleFile = async (file: any) => {
  if (!file) throw new Error("No file uploaded");

  const fileBase64 = `data:${file.mimetype};base64,${file.buffer.toString("base64")}`;
  return await cloudinaryConfig.uploader.upload(fileBase64, { folder: "uploads" });
};

/**
 * Upload multiple files to cloudinary
 * @param {Array} files - Array of Multer file objects (req.files)
 * @returns {Promise<Array>} - Array of cloudinary responses
 */
const uploadMultipleFiles = async (files: any) => {
  if (!files || files.length === 0) throw new Error("No files uploaded");

  const uploadPromises = files.map((file: any) => {
    const fileBase64 = `data:${file.mimetype};base64,${file.buffer.toString("base64")}`;
    return cloudinaryConfig.uploader.upload(fileBase64, { folder: "uploads" });
  });

  return await Promise.all(uploadPromises);
};

export {uploadSingleFile, uploadMultipleFiles}