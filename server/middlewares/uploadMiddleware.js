import multer from "multer";
import fs from "node:fs";

/**
 * MULTER SETUP (disk storage version):
 * Since your uploadToCloudinary helper expects a FILE PATH (`fileLink`),
 * not a memory buffer, we use `multer.diskStorage()` here instead of
 * memoryStorage. This temporarily saves the uploaded file to a local
 * "uploads/" folder on your server. Multer's job is only this — saving the
 * incoming file and giving your controller `req.file.path` to work with.
 * The actual Cloudinary upload happens separately, in the controller.
 */

// Make sure the temp uploads folder exists
const uploadDir = "uploads/";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Prefix with timestamp so two uploads never overwrite each other
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  },
});

// Only allow common image formats
const allowedMimeTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

const fileFilter = (req, file, cb) => {
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only JPG, JPEG, PNG, and WEBP image formats are allowed"), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max file size — reasonable for product photos
  },
});

export default upload;