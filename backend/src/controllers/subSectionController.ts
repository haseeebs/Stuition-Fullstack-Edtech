// Node modules
import { NextFunction, Request, Response } from "express";

// Configuration
import cloudinary from "config/cloudinaryConfig.js";

// Internal Models
import Section from "models/sectionModel.js";
import SubSection from "models/subSectionModel.js";

// Schemas
import { SubsectionSchemaType, subSectionSchema } from "schemas/subSectionSchema.js";

// Utilities
import ExpressError from "utils/ExpressError.js";
import wrapAsync from "utils/wrapAsync.js";

// Create a new subsection under a specific section
// Route: POST /api/sections/:sectionId/subsections
// Access: Private
const createSubSection = wrapAsync(
  async ( req: Request<{ sectionId: string }, {}, SubsectionSchemaType>, res: Response, next: NextFunction ) => {
    
    // Validate the body and params
    const validatedData = subSectionSchema.parse(req.body);
    const { title, description, timeDuration, additionalUrls } = validatedData;
    const { sectionId } = req.params;

    // Check if file is present
    if (!req.file) {
      return next(new ExpressError(400, "Video is required..."));
    }

    let videoUrl;

    try {
      // Upload video to Cloudinary
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: "sub_section_video",
        resource_type: "video",
        public_id: `${title}-${Date.now()}`,
        overwrite: true,
      });

      videoUrl = result.secure_url;
      } catch (error) {
        return next(new ExpressError(500, "Failed to upload video"));
      }

      // Create the new subsection
      const newSubSection = await SubSection.create({
        title,
        description,
        timeDuration,
        videoUrl,
        additionalUrls,
      });

      // Update section with the new subsection
      const updatedSection = await Section.findByIdAndUpdate(sectionId, {
        $push: { subSection: newSubSection._id },
      });

      if (!updatedSection) {
        return next(new ExpressError(404, "Section not found"));
      }

      return res.status(200).json({
        success: true,
        message: "Subsection created successfully",
        data: newSubSection, // Returning the new subsection
      });
    }
);

// Update an existing subsection
// Route: PATCH /api/subsections/:subsectionId
// Access: Private
const updateSubSection = wrapAsync(
  async (req: Request, res: Response, next: NextFunction) => {

    const validatedData = subSectionSchema.partial().parse(req.body);

    const { title, description, timeDuration, additionalUrls } = validatedData;
    const { subsectionId } = req.params;
    
    // Check if the subsection exists
    const subsection = await SubSection.findById(subsectionId);
    
    if (!subsection) {
      return next(new ExpressError(404, "Subsection not found."));
    }

    let videoUrl;

    if (req.file) {
      try {
        const result = await cloudinary.uploader.upload(req.file.path, {
          folder: "sub_section_video",
          resource_type: "video",
          public_id: `${title}-${Date.now()}`,
          overwrite: true,
        });

        videoUrl = result.secure_url;
      } catch (error) {
        return next(new ExpressError(500, "Failed to upload video"));
      }
    }

    // Update subsection in the database
    const updatedSubSection = await SubSection.findByIdAndUpdate(
      subsectionId,
      { 
        $set: {
          title,
          description,
          timeDuration,
          ...(videoUrl && { videoUrl }), // Only update videoUrl if provided
          additionalUrls,
        }
      },
        { new: true }
      );
      
    if (!updatedSubSection) {
      return next(new ExpressError(404, "Failed to update Subsection"));
    }

    return res.status(200).json({
      success: true,
      message: "Subsection updated successfully",
      data: updatedSubSection,
    });
  }
);

// Delete an existing subsection
// Route: DELETE /api/sections/:sectionId/subsections/:subsectionId
// Access: Private
const deleteSubSection = wrapAsync(
  async (req: Request<{ sectionId: string; subsectionId: string }>, res: Response, next: NextFunction) => {
    const { sectionId, subsectionId } = req.params;

    // Update the section to remove the reference to the deleted subsection
    const updatedSection = await Section.findByIdAndUpdate(
      sectionId,
      { $pull: { subSection: subsectionId } },
      { new: true }
    );

    if (!updatedSection) {
      return next(new ExpressError(404, "Section not found"));
    }

    // Find and delete the subsection
    const deletedSubSection = await SubSection.findByIdAndDelete(subsectionId);

    if (!deletedSubSection) {
      return next(new ExpressError(404, "Subsection not found"));
    }

    return res.status(200).json({
      success: true,
      message: "Subsection deleted successfully",
      data: deletedSubSection,
    });
  }
);

export { createSubSection , updateSubSection, deleteSubSection };