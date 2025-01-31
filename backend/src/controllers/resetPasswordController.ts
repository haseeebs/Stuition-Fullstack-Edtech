// Node modules
import { NextFunction, Request, Response } from "express";
import { hash } from "bcrypt";
import crypto from "crypto";

// Internal Models
import User from "models/userModels";

// Templates
import { passwordResetEmailBody } from "templates/emailTemplates";

// Utilities
import ExpressError from "utils/ExpressError";
import mailSender from "utils/mailSender";
import wrapAsync from "utils/wrapAsync";

// Generate and send password reset token
// POST /api/auth//reset-password
// Public
const resetPasswordToken = wrapAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    // Validate email
    const { email } = req.body;
    if (!email) {
      return next(new ExpressError(400, "Email is required"));
    }

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return next(new ExpressError(404, "User with this email does not exist"));
    }

    // Generate and save reset token
    const resetToken = user.generatePasswordResetToken();
    await user.save({ validateBeforeSave: false });

    try {
      // const resetLink = `${req.protocol}://${req.get("host")}/api/auth/reset-password/${resetToken}`; // To check in while developing backend
      const resetLink = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
      const emailBody = passwordResetEmailBody(resetLink);

      // Send email
      await mailSender({email: user.email, subject:"Password reset request", body: emailBody});
    } catch (error) {
      // Clear token if email fails to send
      user.forgotPasswordToken = undefined;
      user.forgotPasswordExpiry = undefined;
      await user.save({ validateBeforeSave: false });

      return next(
        new ExpressError(500, "Failed to send email. Please try again.")
      );
    }

    res.status(200).json({
      success: true,
      message: "Password reset link sent to your email",
    });
  }
);

// Reset User Password
// POST /api/auth/reset-password/:token
// Public
const resetPassword = wrapAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { token } = req.params;
    const { newPassword, confirmNewPassword } = req.body;

    // Hash the token to compare it with the stored hashed token
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    // Find the user with the matching token and valid expiry
    const user = await User.findOne({
      forgotPasswordToken: hashedToken,
      forgotPasswordExpiry: { $gt: Date.now() }, // Token should be valid and not expired
    });

    if (!user) {
      return next(new ExpressError(400, "Invalid or expired token"));
    }

    // Validate password strength
    if (!newPassword || newPassword.length < 8) {
      return next(
        new ExpressError(400, "Password must be at least 8 characters long")
      );
    }

    // Validate that the passwords match
    if (newPassword !== confirmNewPassword) {
      return next(new ExpressError(400, "Passwords do not match"));
    }
    
    // Check if new password is different from current
    const isSamePassword = await user.matchPasswords(newPassword);
    if (isSamePassword) {
      return next(
        new ExpressError(400, "New password must be different from current")
      );
    };

    user.password = newPassword;
    user.forgotPasswordToken = undefined;
    user.forgotPasswordExpiry = undefined;

    await user.save();
    // Send security alert email
    try {
      await mailSender({
        email: user.email,
        subject: "Password Changed Successfully",
        body: `Your password was changed at ${new Date().toLocaleString()}`,
      });
      
    } catch (error) {
      console.error("Password change alert email failed:", error);
    }

    res.status(200).json({
      success: true,
      message: "Password has been reset successfully",
    });
  }
);

export { resetPassword, resetPasswordToken };