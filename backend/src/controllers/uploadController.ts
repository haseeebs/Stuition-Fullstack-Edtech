// Node modules
import multer from "multer";
import path from "path";

// Utilities
import ExpressError from "utils/ExpressError.js";

const __dirname = import.meta.dirname; // Get the directory name

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "../uploads"));
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

// Check file type
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = /jpeg|jpg|png|mp4|avi|mov/; // Add video formats here

  const extname = allowedTypes.test(
    path.extname(file.originalname).toLowerCase()
  );
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new ExpressError(400, "Only images and videos are allowed"));
  }
};

const upload = multer({
  storage,
  limits: { fileSize: 1024 * 1024 * 10 }, // Limit size to 10MB
  fileFilter,
});

export default upload;
