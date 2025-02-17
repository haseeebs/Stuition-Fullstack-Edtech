// Node modules
import { NextFunction, Request, Response } from "express";

// Internal models
import Category from "models/categoryModel.js";
import Course from "models/courseModel.js";
import UserActivity from "models/userActivity.js";

// Schemas
import { categorySchema, CategorySchemaType } from "schemas/categorySchema.js";

// Utilities
import ExpressError from "utils/ExpressError.js";
import wrapAsync from "utils/wrapAsync.js";


// Create a new category
// Route: POST /api/v1/categories
// Access: Private (Only Admin can create categories)
const createCategory = wrapAsync(
  async ( req: Request<{}, {}, CategorySchemaType>, res: Response, next: NextFunction ) => {
    
    const { name, description } = categorySchema.parse(req.body);

    const existingCategory = await Category.findOne({ name });

    if (existingCategory) {
      return next(new ExpressError(400, "Category already exists"));
    }

    const newCategory = await Category.create({ name, description });

    return res.status(200).json({
      success: true,
      message: "Category created successfully",
      newCategory,
    });
  }
);


// Fetch category page details
// Route: GET /api/v1/categories
// Access: Private
const categoryPageDetails = wrapAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user?._id;
    if (!userId) {
      return next(new ExpressError(400, "User ID is required"));
    }

    const userActivity = await UserActivity.findOne({ userId }).populate('viewedCourses.courseId');

    if (!userActivity) {
      return next(new ExpressError(404, "No activity found for this user"));
    }

    // Extract course IDs from user activity
    const viewedCourseIds = userActivity.viewedCourses.map(activity => activity.courseId._id); // Ensure courseId is properly accessed

    // Fetch courses with categories for viewed courses
    const coursesWithCategories = await Course.find({ _id: { $in: viewedCourseIds } }).populate('category');

    // Extract unique category IDs
    const categoryIds = [...new Set(coursesWithCategories.map(course => course.category))];

    // Fetch courses in the same categories
    const recommendedCourses = await Course.find({ category: { $in: categoryIds } }).populate('category');

    // Fetch recent courses viewed by the user
    const recentCourses = await UserActivity.findOne({ userId }, 'viewedCourses')
      .sort({ 'viewedCourses.viewedAt': -1 })
      .populate('viewedCourses.courseId');

    // Fetch popular courses (sorted by number of students enrolled)
    const popularCourses = await Course.find({})
      .sort({ studentsEnrolled: -1 })
      .limit(10);

    // Fetch top-rated courses (sorted by average rating)
    const topRatedCourses = await Course.find({})
      .sort({ avgRating: -1 })
      .limit(10);

    // Combine the results into different sections
    res.status(200).json({
      success: true,
      message: "Data fetched successfully",
      data: {
        recommendedCourses,
        recentCourses,
        popular: popularCourses,
        topRated: topRatedCourses,
      },
    });
  }
);

export { categoryPageDetails, createCategory };