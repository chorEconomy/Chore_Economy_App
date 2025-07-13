import multer from "multer";
// 🔧 Store files in memory instead of disk
const storage = multer.memoryStorage();
const upload = multer({
    storage,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
        files: 4
    }
});
export default upload;
