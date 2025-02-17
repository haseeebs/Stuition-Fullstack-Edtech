// Node modules
import { NextFunction, Request, Response } from "express";

// Internal Models
import Course from "models/courseModel.js";
import Section from "models/sectionModel.js";
import SubSection from "models/subSectionModel.js";

// Schemas
import { CreateSectionSchema, createSectionSchema, sectionParamsSchema, SectionParamsSchema, updateSectionParamsSchema } from "schemas/sectionSchema.js";

// Utilities
import ExpressError from "utils/ExpressError.js";
import wrapAsync from "utils/wrapAsync.js";

// Create a new section under a specific course
// Route: POST /api/courses/:courseId/sections
// Access: Private
const createSection = wrapAsync(
  async (req: Request<SectionParamsSchema, {}, CreateSectionSchema>, res: Response, next: NextFunction) => {
    
    // Validate request body and params
    const { sectionName } = createSectionSchema.parse(req.body);
    const { courseId } = sectionParamsSchema.parse(req.params);
    
    // Create a new section
    const newSection = await Section.create({ sectionName });

    const result = await Course.findByIdAndUpdate(courseId, {
      $push: { sections: newSection._id } // Add the new section's ID to the course's content array
    }, { new: true });

    if (!result) {
      return new ExpressError(404, "Course not found.")
    }

    res.status(200).json({
      success: true,
      message: "Section created successfully",
      sectionId: newSection._id
    });
  }
);

// Update an existing section under a specific course
// Route: PUT /api/courses/:courseId/sections/:sectionId
// Access: Private
const updateSection = wrapAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    
    // Validating the incoming parameters
    const { sectionId } = updateSectionParamsSchema.parse(req.params);
    // Validating the incoming request body
    const { sectionName } = createSectionSchema.partial().parse(req.body); // .partial() allows partial updates

    // Finding and updating the section
    const updatedSection = await Section.findByIdAndUpdate(
      sectionId,
      { sectionName },
      { new: true, runValidators: true }
    );

    if (!updatedSection) {
      return next(new ExpressError(404, "Section not found."));
    }

    res.status(200).json({
      success: true,
      message: "Section updated successfully",
      section: updatedSection,
    });
  }
);

// Delete an existing section under a specific course
// Route: DELETE /api/courses/:courseId/sections/:sectionId
// Access: Private
const deleteSection = wrapAsync(
  async (req: Request, res: Response, next: NextFunction) => {

    const { sectionId } = updateSectionParamsSchema.parse(req.params);

    const section = await Section.findById(sectionId);

    if(!section) {
      return next(new ExpressError(404, "Section not found"))
    }
    
    // Delete all subsections that belong to this section
    await SubSection.deleteMany({_id: { $in: section.subSections }})

    // Removing the section reference from the course
    const course = await Course.findOneAndUpdate(
      { sections: sectionId },
      { $pull: { sections: sectionId } },
      { new: true }
    );

    if (!course) {
      return next(new ExpressError(404, "Course not found."));
    }

    // Deleting the section
    await Section.findByIdAndDelete(sectionId);

    res.status(200).json({
      success: true,
      message: "Section and references deleted successfully",
    });
  }
);

export { createSection, updateSection, deleteSection };