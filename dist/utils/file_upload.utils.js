import cloudinary from "../config/cloudinary.config.js";
/**
 * Upload a single file to Cloudinary
 * @param {Object} file - Multer file object (req.file)
 * @returns {Promise<Object>} - Cloudinary response
 */
const uploadSingleFile = async (file) => {
    if (!file) {
        throw new Error("No file uploaded");
    }
    if (!file.mimetype || !file.buffer) {
        throw new Error("Invalid file format or missing file buffer");
    }
    const fileBase64 = `data:${file.mimetype};base64,${file.buffer.toString("base64")}`;
    return await cloudinary.uploader.upload(fileBase64, { folder: "uploads" });
};
/**
 * Upload multiple files to cloudinary
 * @param {Array} files - Array of Multer file objects (req.files)
 * @returns {Promise<Array>} - Array of cloudinary responses
 */
const uploadMultipleFiles = async (files) => {
    if (!files || files.length === 0)
        throw new Error("No files uploaded");
    const uploadPromises = files.map((file) => {
        const fileBase64 = `data:${file.mimetype};base64,${file.buffer.toString("base64")}`;
        return cloudinary.uploader.upload(fileBase64, { folder: "uploads" });
    });
    return await Promise.all(uploadPromises);
};
export { uploadSingleFile, uploadMultipleFiles };
