// Node modules
import { Router } from "express";

// Middleware
import { customRole, protect } from "middleware/authMiddleware.js";

// Controllers
import { createCourse, deleteCourse, getAllCourses, getCourse, updateCourse } from "controllers/courseController.js";
import { createSection, deleteSection, updateSection } from "controllers/sectionController.js";
import { createSubSection, deleteSubSection, updateSubSection } from "controllers/subSectionController.js";
import upload from "controllers/uploadController.js";

const router = Router();

// Create a new course
router.post("/", protect, customRole("instructor"), upload.single('image'), createCourse);

// Get all courses
router.get("/", protect, getAllCourses);

// Get course by ID
router.get("/:courseId", protect, getCourse);

// Update course by ID
router.put("/:courseId", protect, customRole("instructor"), upload.single('image'), updateCourse);

// Delete course by ID
router.delete("/:courseId", protect, customRole("instructor"), deleteCourse);

// Create a new section under a specific course
router.post("/:courseId/sections", protect, customRole("instructor"), createSection);

// Update an existing section under a specific course
router.put("/:courseId/sections/:sectionId", protect, customRole("instructor"), updateSection);

// Delete an existing section under a specific course
router.delete("/:courseId/sections/:sectionId", protect, customRole("instructor"), deleteSection);

// Create a new subsection under a specific section
router.post("/:courseId/sections/:sectionId/subsections", protect, customRole("instructor"), upload.single('video'), createSubSection);

// Update an existing subsection under a specific section
router.patch("/subsections/:subsectionId", protect, customRole("instructor"), upload.single('video'), updateSubSection);

// Delete an existing subsection under a specific section
router.delete("/sections/:sectionId/subsections/:subsectionId", protect, customRole("instructor"), deleteSubSection);

export default router;