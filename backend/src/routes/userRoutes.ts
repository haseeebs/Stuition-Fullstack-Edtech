// Node modules
import { Router } from "express";
import { customRole, protect } from "middleware/authMiddleware.js";

// Controllers
import { resetPassword, resetPasswordToken } from "controllers/resetPasswordController.js";
import { register, sendOtp, login, logout, changePassword, deleteUser } from "controllers/userController.js";

const router = Router();

// Register a new user
router.post('/register', register);

// User login
router.post("/login", login);

// User logout
router.post("/logout", logout);

// Change password (protected route)
router.post("/change-password", protect, changePassword);

// Request password reset token
router.post("/reset-password", resetPasswordToken);

// Reset password using token
router.post("/reset-password/:token", resetPassword);

// Send OTP for new account verification
router.post("/send-otp", sendOtp);

// Delete user (protected route for admin)
router.delete("/users/:id", protect, customRole("admin"), deleteUser);

// Get user details
// Update user
export default router;