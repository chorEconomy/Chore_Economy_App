import multer from "multer";
import path from "path";
import { v4 as uuidv4 } from "uuid";

// Configure disk storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Make sure this folder exists and is writable
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const filename = `${uuidv4()}${ext}`; // Unique file name
    cb(null, filename);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // Max 10MB per file
    files: 4                     // Max 4 files per request
  }
});

export default upload;
