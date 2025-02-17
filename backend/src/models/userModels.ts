import { model, Schema, Document, ObjectId } from "mongoose";
import crypto from 'crypto';
import { compare, genSalt, hash } from "bcrypt";

// Define the User interface
export interface IUser extends Document {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  isAdmin: boolean;
  accountType: "instructor" | "student";
  profile: Schema.Types.ObjectId;
  courses: Schema.Types.ObjectId[];
  courseProgress: Schema.Types.ObjectId[];
  image: string;
  forgotPasswordToken?: string;
  forgotPasswordExpiry?: number;
  generatePasswordResetToken: () => string;
  matchPasswords: (enteredPassword: string) => Promise<Boolean>;
}

// Define the User schema
const userSchema = new Schema<IUser>({
  firstName: { type: String, required: true, trim: true },
  lastName: { type: String, required: true, trim: true },
  email: { type: String, required: true, lowercase: true, unique: true, trim: true },
  password: { type: String, required: true },
  isAdmin: { type: Boolean, required: true, default: false },
  accountType: { type: String, required: true, enum: [ "instructor", "student" ] },
  profile: { type: Schema.Types.ObjectId, ref: "Profile"},
  courses: [{ type: Schema.Types.ObjectId, ref: "Course" }],
  courseProgress: [{ type: Schema.Types.ObjectId, ref: "CourseProgress" }],
  image: { type: String, required: true },
  forgotPasswordToken: { type: String },
  forgotPasswordExpiry: { type: Number },
});

// Method to match password
userSchema.methods.matchPasswords = async function (enteredPassword: string) {
  return await compare(enteredPassword, this.password)
};

// Method to generate a password reset token
userSchema.methods.generatePasswordResetToken = function () {
  // Generate a random token
  const resetToken = crypto.randomBytes(20).toString('hex');
  
  // Hash the token and set it to the forgotPasswordToken field
  this.forgotPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  
  // Set expiry time to 5 minutes
  this.forgotPasswordExpiry = Date.now() + 5 * 60 * 1000;

  return resetToken;
};

userSchema.pre("save", async function (next) {
  // If password is not modified, move to the next middleware
  if (!this.isModified("password")) return next();

  // Hash the password with the salt
  const salt = await genSalt(10);
  this.password = await hash(this.password, salt);

  next();
});

const User = model<IUser>("User", userSchema);

export default User;
