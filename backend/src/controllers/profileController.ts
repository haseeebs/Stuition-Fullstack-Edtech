// Node modules
import { NextFunction, Request, Response } from "express";

// Internal Models
import Profile from "models/profileModel.js";
import User from "models/userModels.js";

// Schemas
import { profileSchema, ProfileSchemaType } from "schemas/profileSchema.js";

// Utilities
import ExpressError from "utils/ExpressError.js";
import wrapAsync from "utils/wrapAsync.js";

// Update user profile by ID
// Route: PUT /api/v1/profile/updateProfilePicture
// Access: Private (Only the user or authorized personnel can update the profile)
const updateProfile = wrapAsync(
    async (req: Request<{}, {}, ProfileSchemaType>, res: Response, next: NextFunction) => {
        const { about, contactNumber, dateOfBirth, gender } = profileSchema.parse(req.body);

        const profileId = req.user?.profile;

        const updatedProfile = await Profile.findByIdAndUpdate(profileId, {
            about,
            contactNumber,
            dateOfBirth,
            gender
        }, { new: true, runValidators: true })

        if (!updatedProfile) {
            return next(new ExpressError(404, "User's Profile not found"));
        };

        return res.status(200).json({
            success: true,
            message: "User profile updated successfully",
            profile: updatedProfile
        });
    });

// Update user profile picture
// Route: PUT /api/v1/profile/updateProfilePicture
// Access: Private (Only the user or authorized personnel can update the profile picture)
const updateProfilePicture = wrapAsync(
    async (req: Request, res: Response, next: NextFunction) => {
        const userId = req.user?._id;
        const profilePicture = req.file?.path;

        const updatedUser = await User.findByIdAndUpdate(userId, {
            image: profilePicture
        }, { new: true });

        if (!updatedUser) {
            return next(new ExpressError(404, "User not found."))
        };

        return res.status(200).json({
            success: true,
            message: "User profile picture updated successfully",
            updatedUser
        })
    }
);

// Get iser details

export { updateProfile, updateProfilePicture };