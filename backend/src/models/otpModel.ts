import { model, Schema, Document } from "mongoose";
import ExpressError from "utils/ExpressError.js";
import mailSender from "utils/mailSender.js";

// Define the OTP interface
interface IOTP extends Document {
  email: string;
  otp: string;
  expiresAt: Date;
  verifyOtp: (enteredOtp: string) => Promise<boolean>
}

// Define the OTP schema
const otpSchema = new Schema<IOTP>(
  {
    email: { type: String, required: true, trim: true, lowercase: true },
    otp: { type: String, required: true, trim: true },
    expiresAt: { type: Date, required: true, default: () => new Date(Date.now() + 5 * 60 * 1000) }
  },
  {
    timestamps: true,
  }
);

// Add an index to handle expiration
otpSchema.index({ createdAt: 1 }, { expireAfterSeconds: 5 * 60 });

// Helper function to send a verification email
const sendVerificationEmail = async (email: string, otp: string) => {
  try {
    await mailSender({email, subject: 'Verification Email from Stuition', body: otp});
  } catch (error) {
    console.error(`Error occurred while sending email: ${error}`);
    throw error;
  }
};

// Pre-save hook to send email
otpSchema.pre("save", async function (next) {
  const otpDoc = this as IOTP;
  try {
    await sendVerificationEmail(otpDoc.email, otpDoc.otp);
    next();
  } catch (error) {
    next(error as Error);
  }
});

otpSchema.methods.isExpired = function (): boolean {
  return new Date() > this.expiresAt;
};

// Method to verify OTP
otpSchema.methods.verifyOtp = async function (enteredOtp: string): Promise<boolean> {
  if (this.isExpired()) {
    throw new ExpressError(400, "OTP has expired. Please request a new one.");
  }
  return this.otp === enteredOtp;
};

const OTP = model<IOTP>("OTP", otpSchema);

export default OTP;
