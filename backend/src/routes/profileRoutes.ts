// Node modules
import { Router } from "express";

// Middleware
import { protect } from "middleware/authMiddleware.js";

// Controllers
import { updateProfile, updateProfilePicture } from "controllers/profileController.js";
import upload from "controllers/uploadController.js";

const router = Router();

// Update user profile
router.put("/", protect, updateProfile);

// we want to update profilePicture
router.put("/updateProfilePicture", protect, upload.single('profilePicture'), updateProfilePicture);

export default router;
