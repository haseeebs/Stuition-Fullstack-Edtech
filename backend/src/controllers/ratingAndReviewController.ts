// Node modules
import { Schema } from "mongoose";
import { NextFunction, Request, Response } from "express";

// models
import Course from "models/courseModel.js";
import RatingAndReview from "models/ratingAndReviewModel.js";

// Schemas
import { ratingAndReviewSchema, RatingAndReviewSchemaType } from "schemas/ratingAndReviewSchema.js";

// Utilities
import ExpressError from "utils/ExpressError.js";
import wrapAsync from "utils/wrapAsync.js";


// Create a new rating
// Route: POST /api/v1/ratings
// Access: Private (Only authenticated users can create ratings)
const createRating = wrapAsync(
  async (req: Request<{ courseId: string }, {}, RatingAndReviewSchemaType>, res: Response, next: NextFunction) => {

    const userId = req.user?._id;
    const { courseId } = req.params;
    const { rating, review } = ratingAndReviewSchema.parse(req.body);
    
    // Check if course exists
    const course = await Course.findById(courseId)
        .populate("studentsEnrolled")
        .populate("ratingAndReviews");

    if(!course) {
        return next(new ExpressError(404, "Course not found."))
    }
    
    // Check if user has purchased the course
    const isPurchased = course.studentsEnrolled.includes(userId as Schema.Types.ObjectId);
    if(!isPurchased) {
        return next(new ExpressError(403, "You need to be enrolled in this course to leave a review or rating."));
    }
    
    // Check if user has already rated this course
    const existingRating = await RatingAndReview.findOne({ user: userId, course: courseId });
    if(existingRating) {
        return next(new ExpressError(409, "You have already reviewed this course"));
    }   

    // Create new rating and review
    const newRatingAndReview = await RatingAndReview.create({
        user: userId,
        course: new Schema.Types.ObjectId(courseId),
        rating,
        review
    });

    // Add new Rating and review to the course
    course.ratingAndReviews.push(newRatingAndReview._id as Schema.Types.ObjectId);
    
    // Calculate the new average rating
    const avgRating = await course.calculateAvgRating();

    await course.save();

    return res.status(201).json({
        success: true,
        message: `New Rating is created for ${course.courseName}, and the new avgRating is ${avgRating}`,
        newRatingAndReview,
    })
});


// Fetch all reviews for a course
// Route: GET /api/v1/courses/:courseId/reviews
// Access: Public (Anyone can access the list of reviews for a course)
const getReviews = wrapAsync(
    async (req: Request, res: Response, next: NextFunction) => {
        
        const courseId = req.params.courseId;

        if(!courseId) {
            return next(new ExpressError(400, "Course ID is required"))
        };

        const course = await Course.findById(courseId).populate("ratingAndReviews");

        if(!course) {
            return next(new ExpressError(404, "Course not found"))
        };

        const reviews = course.ratingAndReviews;

        res.status(200).json({
            success: true,
            message: "Rating and review successfully fetched",
            reviews
        })
});

export { createRating, getReviews };