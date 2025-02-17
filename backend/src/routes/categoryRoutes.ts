// Node modules
import { Router } from "express";

// Middleware
import { protect, customRole } from "middleware/authMiddleware.js";

// Controllers
import { createCategory, categoryPageDetails } from "controllers/categoryController.js";

const router = Router();

router.route('/')
    .get(protect, categoryPageDetails) //  Get category page details 
    .post(protect, customRole("admin"), createCategory); // Create a new category 

export default router;
