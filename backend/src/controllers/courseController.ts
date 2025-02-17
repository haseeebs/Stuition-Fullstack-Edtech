// Node modules
import { NextFunction, Request, Response } from "express";

// Configurations
import cloudinary from "config/cloudinaryConfig.js";

// Internal models
import Course from "models/courseModel.js";
import RatingAndReview from "models/ratingAndReviewModel.js";
import Section from "models/sectionModel.js";
import SubSection from "models/subSectionModel.js";
import User from "models/userModels.js";

// Schemas
import { courseSchema, CourseType } from "schemas/courseSchema.js";

// Utilities
import ExpressError from "utils/ExpressError.js";
import wrapAsync from "utils/wrapAsync.js";
import UserActivity from "models/userActivity.js";


// Fetch a single course by ID
// Route: GET /api/v1/courses/:id
// Access: Public (Anyone can access course details)
const getCourse = wrapAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { courseId } = req.params;
    const userId = req.user?._id;

    // We can also populate related fields like instructor and sections
    const course = await Course.findById(courseId)
      .populate({
        path: "instructor",
        select: "image firstName email",
        populate: {
          path: "profile",
          select: "about contactNumber"
        }
      })
      .populate("category")
      .populate({
        path: "sections",
        select: "sectionName",
        populate: {
          path: "subSection",
          select: "title timeDuration description"
        }
      })
      .populate({
        path: "ratingAndReviews",
        populate: {
          "path": "user",
          "select": "firstName"
        }
      })
      .populate({
        path: 'studentsEnrolled',
        select: 'name',
        populate: {
          path: 'profile',
          select: 'about contactNumber'
        }
      }).exec();

    if (!course) {
      return next(new ExpressError(404, "Course not found."));
    }

    await UserActivity.findOneAndUpdate(
        { userId },
        { $push: { viewedCourses: { courseId, viewedAt: Date.now() } } },
        { new: true, upsert: true }
    );

    return res.status(200).json({
      success: true,
      message: "Course fetched successfully",
      data: course,
    });
  }
);

// Fetch all courses
// Route: GET /api/v1/courses
// Access: Public (Anyone can access the list of courses)
const getAllCourses = wrapAsync(async (req: Request, res: Response) => {
  const courses = await Course.find()
    .populate({
      path: "instructor",
      select: "firstName email accountType",
      populate: {
        path: "profile",
        select: "user"
      }
    })
    .populate("category")
    .populate({
      path: "sections",
      select: "sectionName",
      populate: {
        path: "subSection",
        select: "title timeDuration description"
      }
    })
    .populate("ratingAndReviews")
    .exec();

  res.status(200).json({
    success: true,
    data: courses,
  });
});

// Create a new course
// Route: POST /api/v1/courses
// Access: Private (Only instructors can create courses)
const createCourse = wrapAsync(
  async (req: Request<{}, {}, CourseType>, res: Response, next: NextFunction) => {

    // Validate request body using Zod schema
    const validatedData = courseSchema.parse(req.body);

    const { courseName, courseDescription, price, category, tags, whatYouWillLearn } = validatedData;
    
    // Check if file is present
    if (!req.file) {
      return next(new ExpressError(400, "Thumbnail is required..."));
    }

    const thumbnail = req.file?.path;

    // Upload thumbnail to Cloudinary
    const result = await cloudinary.uploader.upload( thumbnail, {
      folder:  "course_thumbnails",
      resource_type: "image",
      public_id: `${courseName}-${Date.now()}`,
      overwrite: true
    });
    
    // Create a new course
    const newCourse = await Course.create({
      courseName,
      courseDescription,
      instructor: req.user?._id,
      whatYouWillLearn,
      price,
      thumbnail: result.secure_url,
      category,
      tags
    });

    // Send response
    res.status(200).json({
      success: true,
      message: "Course created successfully...",
      courseId: newCourse._id
    });
  }
);

// Update a course by ID
// Route: PUT /api/v1/courses/:id
// Access: Private (Only Instructor and Admin can update courses)
const updateCourse = wrapAsync( 
  async (req: Request<{ courseId: string },{},CourseType>, res: Response, next: NextFunction) => {

    const validatedData = courseSchema.partial().parse(req.body);

    const { courseName, courseDescription, price, category, tags, whatYouWillLearn } = validatedData;
    const { courseId } = req.params;

    const course = await Course.findById(courseId);

    if(!course) {
      return next(new ExpressError(404, "Course not found."))
    }

    let thumbnail;

    if(req.file) {
      try {
        const result = await cloudinary.uploader.upload(req.file.path, {
          folder:  "course_thumbnails",
          resource_type: "image",
          public_id: `${courseName}-${Date.now()}`,
          overwrite: true
        });

        thumbnail = result.secure_url;
      } catch (error) {
        return next(new ExpressError(500, "Failed to upload image"));
      }
    }
    
    // Update course document
    const updatedCourse = await Course.findByIdAndUpdate(
      courseId,
      {
        $set: {
          courseName,
          courseDescription,
          whatYouWillLearn,
          price,
          ...(thumbnail && { thumbnail }), // Only update thumbnail if provided
          category,
          tags
        }
      },
      { new: true, runValidators: true } // Ensure updated data is validated
    );

    if(!updatedCourse) {
      return next(new ExpressError(404, "Failed to update course"))
    }

    return res.status(200).json({
      success: true,
      message: "Course updated successfully",
      data: updatedCourse,
    });
  }
);

// Delete a course
// Route: DELETE /api/v1/courses/:id
// Access: Private (Only instructors can delete courses)
const deleteCourse = wrapAsync(
  async (req: Request<{ courseId: string }>, res: Response, next: NextFunction) => {
    const { courseId } = req.params;

    // Find the course by ID
    const course = await Course.findById(courseId);

    // Check if the course exists
    if (!course) {
      return next(new ExpressError(404, "Course not found"));
    }

    const sections = await Section.find({ _id: { $in: course.sections } });
    
    // Collect all subsection IDs in one array
    const allSubsectionIds = sections.flatMap(section => section.subSections );

    // Delete related subsesction
    await SubSection.deleteMany({_id: {$in: allSubsectionIds }})

    // Delete related sections
    await Section.deleteMany({ _id: { $in: course.sections } })

    // Delete related ratings and reviews
    await RatingAndReview.deleteMany({ _id: { $in: course.ratingAndReviews } });

    // Remove course from students' enrolled courses
    await User.updateMany(
      { _id: { $in: course.studentsEnrolled } },
      { $pull: { courses: course._id } }
    );

    // Delete the course thumbnail from Cloudinary
    // const publicId = course.thumbnail.split('/').pop()?.split('.')[0];
    // if (publicId) {
    //   await cloudinary.uploader.destroy(`course_thumbnails/${publicId}`);
    // }

    // Delete the course
    await Course.findByIdAndDelete(courseId);

    res.status(200).json({
      success: true,
      message: "Course and it's related data deleted successfully.",
    });
  }
);

// Course create ki 3 stage rakho first draft , ... and jab admin approve karega to hi publish state me jaega // Status

export { getCourse, getAllCourses, createCourse, updateCourse, deleteCourse };

