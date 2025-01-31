// Node modules
import { Router } from "express";
import { customRole, protect } from "middleware/authMiddleware";

// Controllers
import { resetPassword, resetPasswordToken } from "controllers/resetPasswordController";
import { changePassword, deleteUser, login, logout, register, sendOtp } from "controllers/userController";

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

// Update user
export default router;